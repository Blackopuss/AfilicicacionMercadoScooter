import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest as ruta } from '../../functions/api/ruta';
import {
  alcance,
  distanciaRectaKm,
  FACTOR_DESVIO,
  kmEstimados,
  parsePunto,
  sugerenciasPhoton,
  urlPhoton,
} from '../../src/lib/mapa';

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
    expect((await ruta({ request: pedir(`/api/ruta?desde=${CDMX}&hasta=${COYOACAN}`), env: {} })).status).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });

  it('entrada inválida → 400', async () => {
    const f = fetchFalso({});
    expect((await ruta({ request: pedir(`/api/ruta?desde=${CDMX}&hasta=${COYOACAN}&extra=1`), env })).status).toBe(400);
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
    const r = `/api/ruta?desde=${CDMX}&hasta=${COYOACAN}`;
    expect((await ruta({ request: pedir(r, { method: 'POST' }), env })).status).toBe(405);
    expect((await ruta({ request: pedir(r, { headers: { Origin: 'https://otro.com' } }), env })).status).toBe(403);
    expect((await ruta({ request: pedir(r, { headers: { 'Sec-Fetch-Site': 'cross-site' } }), env })).status).toBe(403);
    expect((await ruta({ request: pedir(`${r}${'0'.repeat(600)}`), env })).status).toBe(414);
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

describe('sugerenciasPhoton', () => {
  const punto = (lon: number, lat: number) => ({ type: 'Point', coordinates: [lon, lat] });
  it('arma el nombre en el orden de México y sin repetir la ciudad', () => {
    const data = {
      features: [
        {
          geometry: punto(-99.1815881, 19.3639017),
          properties: {
            name: 'CitiCenter',
            street: 'Avenida Insurgentes Sur',
            housenumber: '1602',
            locality: 'Colonia Crédito Constructor',
            district: 'Benito Juárez',
            city: 'Ciudad de México',
            state: 'Ciudad de México',
            countrycode: 'MX',
          },
        },
        { geometry: punto(-99.16, 19.35), properties: { street: 'Calle Allende', housenumber: '5', district: 'Coyoacán', state: 'Ciudad de México', countrycode: 'MX' } },
      ],
    };
    expect(sugerenciasPhoton(data)).toEqual([
      {
        titulo: 'CitiCenter',
        detalle: 'Avenida Insurgentes Sur 1602, Colonia Crédito Constructor, Ciudad de México',
        nombre: 'CitiCenter, Avenida Insurgentes Sur 1602, Colonia Crédito Constructor, Ciudad de México',
        lon: -99.1815881,
        lat: 19.3639017,
      },
      {
        titulo: 'Calle Allende 5',
        detalle: 'Coyoacán, Ciudad de México',
        nombre: 'Calle Allende 5, Coyoacán, Ciudad de México',
        lon: -99.16,
        lat: 19.35,
      },
    ]);
  });
  it('descarta lo que cae fuera de México, sin nombre, repetido o mal formado', () => {
    const cdmx = { geometry: punto(-99.13, 19.43), properties: { name: 'Zócalo', countrycode: 'MX' } };
    const data = {
      features: [
        { geometry: punto(-74, 40.7), properties: { name: 'Nueva York' } },
        { geometry: punto(-90.51, 14.64), properties: { name: 'Ciudad de Guatemala', countrycode: 'GT' } },
        { geometry: punto(-99.1, 19.4), properties: {} },
        { geometry: { coordinates: ['-99', '19'] }, properties: { name: 'Texto' } },
        null,
        cdmx,
        cdmx,
      ],
    };
    expect(sugerenciasPhoton(data).map((s) => s.nombre)).toEqual(['Zócalo']);
    for (const raro of [null, 'hola', {}, { features: 'x' }]) expect(sugerenciasPhoton(raro)).toEqual([]);
  });
  it('urlPhoton pide 5 resultados dentro de México y escapa el texto', () => {
    const url = new URL(urlPhoton('Reforma 222 & Juárez'));
    expect(url.origin + url.pathname).toBe('https://photon.komoot.io/api/');
    expect(url.searchParams.get('q')).toBe('Reforma 222 & Juárez');
    expect(url.searchParams.get('limit')).toBe('5');
    expect(url.searchParams.get('bbox')).toBe('-118.6,14.4,-86.5,32.8');
  });
});

describe('distancia estimada', () => {
  const zocalo = { lon: -99.1332, lat: 19.4326 };
  const coyoacan = { lon: -99.1625, lat: 19.3467 };
  it('haversine da la línea recta', () => {
    expect(distanciaRectaKm(zocalo, zocalo)).toBe(0);
    expect(distanciaRectaKm(zocalo, coyoacan)).toBeCloseTo(10.0, 0);
    // CDMX → Guadalajara: unos 460 km en línea recta.
    expect(distanciaRectaKm(zocalo, { lon: -103.3496, lat: 20.6597 })).toBeCloseTo(461, -1);
  });
  it('los km estimados son la recta × el factor de desvío, con un decimal', () => {
    expect(kmEstimados(zocalo, coyoacan)).toBe(Math.round(distanciaRectaKm(zocalo, coyoacan) * FACTOR_DESVIO * 10) / 10);
  });
});
