import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatoFecha } from '../../src/lib/formato';
import { getHistorial, resumenHistorial, type PuntoHistorial } from '../../src/lib/historial';
import { esPrecioValido } from '../../src/lib/precios';

const ENV = { PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9', PUBLIC_SUPABASE_ANON_KEY: 'x' };
const p = (fecha: string, precioMxn: number, disponible = true): PuntoHistorial => ({ fecha, precioMxn, disponible });

describe('getHistorial', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sin variables devuelve []', async () => {
    expect(await getHistorial('modelo', 90, {})).toEqual([]);
  });

  it('pide solo ese modelo y esos días, en orden cronológico, y mapea las filas', async () => {
    const fetch = vi.fn(async () =>
      Response.json([{ precio_mxn: 9999, disponible: false, verificado_en: '2026-10-01T15:00:00+00:00' }]),
    );
    vi.stubGlobal('fetch', fetch);
    const puntos = await getHistorial('xiaomi-5', 30, ENV);
    expect(puntos).toEqual([p('2026-10-01T15:00:00+00:00', 9999, false)]);
    const url = decodeURIComponent(String((fetch.mock.calls[0] as unknown[])[0]));
    expect(url).toContain('/rest/v1/precios?');
    expect(url).toContain('scooter_slug=eq.xiaomi-5');
    expect(url).toMatch(/verificado_en=gte\.\d{4}-/);
    expect(url).toContain('order=verificado_en.asc,id.asc');
  });

  it('si la consulta falla devuelve [] sin lanzar', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await getHistorial('modelo', 90, ENV)).toEqual([]);
  }, 15_000); // supabase-js reintenta antes de rendirse
});

describe('resumenHistorial', () => {
  const ahora = new Date('2026-10-30T12:00:00Z');

  it('vacío → null', () => {
    expect(resumenHistorial([], ahora)).toBeNull();
  });

  it('mínimo y máximo de todo el periodo; ante empate, el más reciente', () => {
    const puntos = [p('2026-08-01T00:00:00Z', 8000), p('2026-09-01T00:00:00Z', 12000), p('2026-10-20T00:00:00Z', 8000)];
    const r = resumenHistorial(puntos, ahora)!;
    expect(r.min).toBe(puntos[2]);
    expect(r.max).toBe(puntos[1]);
  });

  it('el más bajo en 30 días ignora lo anterior a 30 días y lo que no tenía stock', () => {
    const puntos = [
      p('2026-09-01T00:00:00Z', 7000), // fuera de los 30 días
      p('2026-10-05T00:00:00Z', 9500),
      p('2026-10-10T00:00:00Z', 8000, false), // agotado
      p('2026-10-25T00:00:00Z', 10500),
    ];
    const r = resumenHistorial(puntos, ahora)!;
    expect(r.min.precioMxn).toBe(7000);
    expect(r.minimo30d).toBe(puntos[1]);
  });

  it('sin stock en 30 días → minimo30d null', () => {
    expect(resumenHistorial([p('2026-10-25T00:00:00Z', 9000, false)], ahora)!.minimo30d).toBeNull();
  });
});

describe('esPrecioValido', () => {
  it('acepta enteros de 1 a 200 000 y rechaza el resto', () => {
    for (const ok of [1, 12499, 200000]) expect(esPrecioValido(ok)).toBe(true);
    for (const mal of [0, -5, 200001, 12.5, NaN, Infinity]) expect(esPrecioValido(mal)).toBe(false);
  });
});

describe('formatoFecha', () => {
  it('fecha corta en hora del centro de México', () => {
    expect(formatoFecha('2026-10-30T03:00:00Z')).toBe('29 oct 2026'); // 21:00 del 29 en CDMX
  });
});
