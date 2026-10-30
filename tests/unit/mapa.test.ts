import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest as geocode } from '../../functions/api/geocode';
import { onRequest as ruta } from '../../functions/api/ruta';
import { alcance, parsePunto } from '../../src/lib/mapa';

describe('alcance', () => {
  it('calcula lo que sobra cuando llega', () => {
    expect(alcance(20, 5)).toEqual({ llega: true, sobraPct: 75, sobraKm: 15 });
    expect(alcance(20, 20)).toEqual({ llega: true, sobraPct: 0, sobraKm: 0 });
  });
  it('marca que no llega y cuántos km faltan', () => {
    expect(alcance(20, 25.04)).toEqual({ llega: false, sobraPct: 0, sobraKm: -5 });
  });
  it('rechaza valores imposibles', () => {
    expect(() => alcance(0, 5)).toThrow(RangeError);
    expect(() => alcance(20, -1)).toThrow(RangeError);
    expect(() => alcance(20, Number.NaN)).toThrow(RangeError);
  });
});

describe('parsePunto', () => {
  it('acepta "lon,lat" dentro de México', () => {
    expect(parsePunto('-99.1332,19.4326')).toEqual({ lon: -99.1332, lat: 19.4326 });
  });
  it('rechaza fuera de México, formatos raros y vacío', () => {
    for (const t of ['-74.006,40.7128', '19.4326,-99.1332', '-99.1,19.4,1', ' -99.1,19.4', '-99,19e1', 'abc', '', null]) {
      expect(parsePunto(t)).toBeNull();
    }
  });
});

const CDMX = '-99.1332,19.4326';
const COYOACAN = '-99.1625,19.3467';
const pedir = (ruta: string, init: RequestInit = {}) => new Request(`https://sitio.mx${ruta}`, init);
const env = { MAPBOX_TOKEN: 'pk.prueba' };

describe('functions/api', () => {
  afterEach(() => vi.unstubAllGlobals());
  const fetchFalso = (cuerpo: unknown, status = 200) => {
    const f = vi.fn(async (_url: URL) => new Response(JSON.stringify(cuerpo), { status }));
    vi.stubGlobal('fetch', f);
    return f;
  };

  it('sin token responde 503 y no llama al proveedor', async () => {
    const f = fetchFalso({});
    expect((await geocode({ request: pedir('/api/geocode?q=Reforma'), env: {} })).status).toBe(503);
    expect((await ruta({ request: pedir(`/api/ruta?desde=${CDMX}&hasta=${COYOACAN}`), env: {} })).status).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });

  it('entrada inválida → 400', async () => {
    const f = fetchFalso({});
    for (const q of ['', 'ab', 'x'.repeat(121)]) {
      expect((await geocode({ request: pedir(`/api/geocode?q=${q}`), env })).status).toBe(400);
    }
    expect((await geocode({ request: pedir('/api/geocode?q=Reforma&extra=1'), env })).status).toBe(400);
    expect((await ruta({ request: pedir(`/api/ruta?desde=${CDMX}`), env })).status).toBe(400);
    expect((await ruta({ request: pedir(`/api/ruta?desde=hola&hasta=${CDMX}`), env })).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it('coordenadas fuera de México → 400', async () => {
    const f = fetchFalso({});
    const res = await ruta({ request: pedir(`/api/ruta?desde=-74.006,40.7128&hasta=${CDMX}`), env });
    expect(res.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it('método, origen y tamaño', async () => {
    fetchFalso({});
    expect((await geocode({ request: pedir('/api/geocode?q=Reforma', { method: 'POST' }), env })).status).toBe(405);
    const ajeno = pedir('/api/geocode?q=Reforma', { headers: { Origin: 'https://otro.com' } });
    expect((await geocode({ request: ajeno, env })).status).toBe(403);
    const otroSitio = pedir('/api/geocode?q=Reforma', { headers: { 'Sec-Fetch-Site': 'cross-site' } });
    expect((await geocode({ request: otroSitio, env })).status).toBe(403);
    expect((await geocode({ request: pedir(`/api/geocode?q=${'x'.repeat(600)}`), env })).status).toBe(414);
  });

  it('geocode devuelve solo lugares en México, sin caché', async () => {
    const f = fetchFalso({
      features: [
        { properties: { full_address: 'Reforma, CDMX' }, geometry: { coordinates: [-99.16, 19.43] } },
        { properties: { full_address: 'Fuera' }, geometry: { coordinates: [-74, 40.7] } },
      ],
    });
    const res = await geocode({ request: pedir('/api/geocode?q=Reforma'), env });
    expect(await res.json()).toEqual({ lugares: [{ nombre: 'Reforma, CDMX', lon: -99.16, lat: 19.43 }] });
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const url = new URL(String(f.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.mapbox.com/search/geocode/v6/forward');
    expect(url.searchParams.get('country')).toBe('mx');
  });

  it('ruta devuelve km, minutos y geometría', async () => {
    fetchFalso({ code: 'Ok', routes: [{ distance: 12345, duration: 2700, geometry: { type: 'LineString', coordinates: [[-99.13, 19.43], [-99.16, 19.35]] } }] });
    const res = await ruta({ request: pedir(`/api/ruta?desde=${CDMX}&hasta=${COYOACAN}`), env });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      distanciaKm: 12.3,
      duracionMin: 45,
      desnivelM: null,
      geometria: { type: 'LineString', coordinates: [[-99.13, 19.43], [-99.16, 19.35]] },
    });
  });

  it('sin ruta → 404; proveedor caído → 502 genérico', async () => {
    fetchFalso({ code: 'NoRoute', routes: [] }, 422);
    expect((await ruta({ request: pedir(`/api/ruta?desde=${CDMX}&hasta=${COYOACAN}`), env })).status).toBe(404);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchFalso({ message: 'Not Authorized - Invalid Token' }, 401);
    const res = await ruta({ request: pedir(`/api/ruta?desde=${CDMX}&hasta=${COYOACAN}`), env });
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('Token');
  });
});
