import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Cliente de Supabase simulado: cada consulta encadenada resuelve con el resultado de su tabla.
const llamadas: [tabla: string, metodo: string, args: unknown[]][] = [];
const resultados: Record<string, unknown> = {};
const getUser = vi.fn();
function consulta(tabla: string): unknown {
  const cadena: unknown = new Proxy(
    {},
    {
      get: (_, metodo) =>
        metodo === 'then'
          ? (ok: (v: unknown) => void) => ok(resultados[tabla])
          : (...args: unknown[]) => (llamadas.push([tabla, String(metodo), args]), cadena),
    },
  );
  return cadena;
}
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { getUser }, from: consulta }) }));

const { onRequest } = await import('../../functions/api/publicar');

const ORIGEN = 'https://sitio.example';
const ENV = {
  PUBLIC_SUPABASE_URL: 'https://proyecto.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  CF_DEPLOY_HOOK_URL: 'https://api.cloudflare.com/hook',
};
const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (claims: object) => `${b64url({ alg: 'HS256' })}.${b64url(claims)}.firma`;
const admin = { id: 'u1', app_metadata: { role: 'admin' }, user_metadata: {} };

function pedir({ method = 'POST', origin = ORIGEN, token = jwt({ aal: 'aal2' }) as string | null } = {}) {
  const headers = new Headers();
  if (origin) headers.set('Origin', origin);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return onRequest({ request: new Request(`${ORIGEN}/api/publicar`, { method, headers }), env: ENV });
}

let hook: ReturnType<typeof vi.fn>;
beforeEach(() => {
  llamadas.length = 0;
  resultados.auditoria = { data: null, error: null };
  resultados.precios = { count: 3, error: null };
  getUser.mockReset().mockResolvedValue({ data: { user: admin }, error: null });
  hook = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal('fetch', hook);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /api/publicar falla cuando debe', () => {
  it('405 con otro método', async () => {
    for (const method of ['GET', 'PUT', 'OPTIONS']) {
      const r = await pedir({ method });
      expect(r.status).toBe(405);
      expect(r.headers.get('Allow')).toBe('POST');
    }
  });

  it('403 con origen ajeno o sin origen', async () => {
    expect((await pedir({ origin: 'https://evil.example' })).status).toBe(403);
    expect((await pedir({ origin: '' })).status).toBe(403);
  });

  it('401 sin token, con token malformado o que Supabase rechaza', async () => {
    expect((await pedir({ token: null })).status).toBe(401);
    expect((await pedir({ token: 'no-es-un-jwt' })).status).toBe(401);
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid JWT') });
    expect((await pedir()).status).toBe(401);
  });

  it('403 sin rol admin en app_metadata (user_metadata no cuenta)', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u2', app_metadata: {}, user_metadata: { role: 'admin' } } },
      error: null,
    });
    expect((await pedir({ token: jwt({ aal: 'aal2', user_metadata: { role: 'admin' } }) })).status).toBe(403);
  });

  it('403 si el admin no tiene MFA (aal1)', async () => {
    expect((await pedir({ token: jwt({ aal: 'aal1' }) })).status).toBe(403);
  });

  it('en ningún rechazo toca la base ni el deploy hook', async () => {
    await pedir({ token: jwt({ aal: 'aal1' }) });
    await pedir({ origin: 'https://evil.example' });
    expect(llamadas).toEqual([]);
    expect(hook).not.toHaveBeenCalled();
  });

  it('500 genérico si falla el deploy hook, sin detalles', async () => {
    hook.mockResolvedValue(new Response('detalle interno', { status: 500 }));
    const r = await pedir();
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: 'No se pudo publicar' });
  });

  it('500 sin variables de entorno', async () => {
    const r = await onRequest({
      request: new Request(`${ORIGEN}/api/publicar`, { method: 'POST', headers: { Origin: ORIGEN, Authorization: `Bearer ${jwt({ aal: 'aal2' })}` } }),
      env: {},
    });
    expect(r.status).toBe(500);
  });
});

describe('POST /api/publicar con admin y aal2', () => {
  it('registra en auditoria y dispara el deploy hook', async () => {
    const token = jwt({ aal: 'aal2' });
    const r = await pedir({ token });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, preciosCambiados: 3 });
    expect(getUser).toHaveBeenCalledWith(token);
    expect(llamadas).toContainEqual(['auditoria', 'insert', [{ usuario_id: 'u1', accion: 'publicar', precios_cambiados: 3 }]]);
    expect(hook).toHaveBeenCalledWith(ENV.CF_DEPLOY_HOOK_URL, { method: 'POST' });
  });

  it('cuenta solo los precios desde la publicación anterior', async () => {
    resultados.auditoria = { data: { creado_en: '2026-10-29T12:00:00Z' }, error: null };
    await pedir();
    expect(llamadas).toContainEqual(['precios', 'gt', ['verificado_en', '2026-10-29T12:00:00Z']]);
  });
});
