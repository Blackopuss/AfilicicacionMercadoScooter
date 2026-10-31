import { beforeEach, describe, expect, it, vi } from 'vitest';
import { desdeSemana, resumirClics } from '../../src/lib/clics';

// Supabase simulado: sumar_clic suma en memoria. Las pruebas demuestran que el endpoint falla cuando debe (seguridad.md §8).

const estado = vi.hoisted(() => ({ contador: new Map<string, number>(), error: null as unknown }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    async rpc(nombre: string, args: { slug: string; lugar: string }) {
      if (estado.error) return { error: estado.error };
      const k = `${nombre}:${args.slug}:${args.lugar}`;
      estado.contador.set(k, (estado.contador.get(k) ?? 0) + 1);
      return { error: null };
    },
  }),
}));

const { onRequest } = await import('../../functions/api/clic');

const ORIGEN = 'https://sitio.test';
const ENV = {
  PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  ASSETS: { fetch: async () => Response.json({ 'modelo-a': 'Marca A' }) },
};
const valido = { slug: 'modelo-a', lugar: 'ficha' };

beforeEach(() => {
  estado.contador.clear();
  estado.error = null;
});

async function post(body: unknown, headers: Record<string, string> = {}, method = 'POST', env: object = ENV) {
  const request = new Request(`${ORIGEN}/api/clic`, {
    method,
    // Lo que manda sendBeacon con un string: text/plain.
    headers: { Origin: ORIGEN, 'Content-Type': 'text/plain;charset=UTF-8', ...headers },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return onRequest({ request, env });
}

describe('POST /api/clic', () => {
  it('método distinto de POST → 405', async () => {
    const r = await post(null, {}, 'GET');
    expect(r.status).toBe(405);
    expect(r.headers.get('Allow')).toBe('POST');
  });

  it.each([['otro origen', { Origin: 'https://malo.test' }], ['sin Origin', { Origin: '' }]])('%s → 403 y no cuenta', async (_, h) => {
    expect((await post(valido, h)).status).toBe(403);
    expect(estado.contador.size).toBe(0);
  });

  it.each([
    ['JSON roto', '{'],
    ['slug con ruta', { ...valido, slug: '../admin' }],
    ['slug que no está en el catálogo', { ...valido, slug: 'no-existe' }],
    ['lugar fuera de la lista', { ...valido, lugar: 'popup' }],
    ['campo extra', { ...valido, ip: '1.2.3.4' }],
    ['sin lugar', { slug: 'modelo-a' }],
  ])('%s → 400 y no cuenta', async (_, body) => {
    expect((await post(body)).status).toBe(400);
    expect(estado.contador.size).toBe(0);
  });

  it('body grande → 413', async () => {
    expect((await post({ ...valido, slug: 'x'.repeat(500) })).status).toBe(413);
    expect(estado.contador.size).toBe(0);
  });

  it('clic válido → 204 sin cuerpo y suma 1 cada vez', async () => {
    const r = await post(valido);
    expect(r.status).toBe(204);
    expect(await r.text()).toBe('');
    await post(valido);
    await post({ ...valido, lugar: 'comparar' });
    expect([...estado.contador]).toEqual([
      ['sumar_clic:modelo-a:ficha', 2],
      ['sumar_clic:modelo-a:comparar', 1],
    ]);
  });

  it('sin variables de Supabase → 500 genérico', async () => {
    const r = await post(valido, {}, 'POST', { ASSETS: ENV.ASSETS });
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: 'No disponible' });
  });

  it('error de la base → 500 sin detalles', async () => {
    estado.error = { message: 'relation "clics_diarios" does not exist', details: 'secreto' };
    const r = await post(valido);
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: 'No disponible' });
  });
});

describe('resumen de clics', () => {
  it('suma por modelo y por lugar, de más a menos', () => {
    const r = resumirClics([
      { scooter_slug: 'b', lugar: 'ficha', total: 2 },
      { scooter_slug: 'a', lugar: 'ficha', total: 1 },
      { scooter_slug: 'a', lugar: 'comparar', total: 4 },
      { scooter_slug: 'b', lugar: 'ficha', total: 1 },
    ]);
    expect(r.total).toBe(8);
    expect(r.porModelo).toEqual([['a', 5], ['b', 3]]);
    expect(r.porLugar).toEqual([['comparar', 4], ['ficha', 4]]); // empate: orden alfabético
  });

  it('sin filas → todo en cero', () => {
    expect(resumirClics([])).toEqual({ total: 0, porModelo: [], porLugar: [] });
  });

  it('la semana empieza 6 días antes de hoy en hora de México', () => {
    // 1 nov 03:00 UTC = 31 oct 21:00 en CDMX: hoy es 31 oct, la semana empieza el 25.
    expect(desdeSemana(new Date('2026-11-01T03:00:00Z'))).toBe('2026-10-25');
    expect(desdeSemana(new Date('2026-11-01T12:00:00Z'))).toBe('2026-10-26');
  });
});
