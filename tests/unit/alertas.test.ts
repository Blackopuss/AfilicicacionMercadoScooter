import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { precioParaAvisar, emailAviso, emailConfirmacion, type Alerta } from '../../src/lib/alertas';

// Supabase, Brevo y Turnstile simulados. Las pruebas demuestran que los endpoints fallan cuando deben (seguridad.md §8).

type Fila = Record<string, unknown>;
const estado = vi.hoisted(() => ({ tablas: {} as Record<string, Fila[]>, rpc: [] as unknown[] }));

// Base en memoria con lo justo del query builder de supabase-js que usan los endpoints.
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from(t: string) {
      let op = 'select';
      let datos: Fila = {};
      let head = false;
      const filtros: [string, unknown][] = [];
      const filas = () => (estado.tablas[t] ??= []).filter((f) => filtros.every(([c, v]) => f[c] === v));
      const ejecutar = () => {
        if (op === 'insert') {
          estado.tablas[t].push({ id: estado.tablas[t].length + 1, confirmado: false, creado_en: new Date().toISOString(), ultimo_aviso_mxn: null, ...datos });
        } else if (op === 'update') filas().forEach((f) => Object.assign(f, datos));
        else if (op === 'delete') {
          const fuera = new Set(filas());
          estado.tablas[t] = estado.tablas[t].filter((f) => !fuera.has(f));
        } else return head ? { count: filas().length, data: null, error: null } : { data: filas().map((f) => ({ ...f })), error: null };
        return { data: null, error: null };
      };
      const q = {
        select: (_c?: string, o?: { head?: boolean }) => ((head = !!o?.head), q),
        insert: (f: Fila) => ((op = 'insert'), (datos = f), q),
        update: (f: Fila) => ((op = 'update'), (datos = f), q),
        delete: () => ((op = 'delete'), q),
        eq: (c: string, v: unknown) => (filtros.push([c, v]), q),
        maybeSingle: async () => ({ data: (ejecutar().data as Fila[] | null)?.[0] ?? null, error: null }),
        then: (ok: (r: unknown) => unknown, mal: (e: unknown) => unknown) => Promise.resolve(ejecutar()).then(ok, mal),
      };
      return q;
    },
    async rpc(nombre: string, args: { ids: number[]; hashes: string[]; precios: number[] }) {
      estado.rpc.push({ nombre, args });
      args.ids.forEach((id, i) => {
        const f = estado.tablas.alertas.find((a) => a.id === id && a.confirmado);
        if (f) Object.assign(f, { token_hash: args.hashes[i], ultimo_aviso_mxn: args.precios[i] });
      });
      return { error: null };
    },
  }),
}));

const { onRequest: suscribir } = await import('../../functions/api/alertas/index');
const { onRequest: confirmar } = await import('../../functions/api/alertas/confirmar');
const { onRequest: baja } = await import('../../functions/api/alertas/baja');
const { enviarAvisos, supabaseAdmin } = await import('../../functions/_lib/alertas');

const ORIGEN = 'https://sitio.test';
const sha = (t: string) => createHash('sha256').update(t).digest('hex');
const ENV = {
  PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  TURNSTILE_SECRET_KEY: 'secreto',
  BREVO_API_KEY: 'brevo',
  BREVO_SENDER_EMAIL: 'alertas@sitio.test',
  ASSETS: { fetch: async () => Response.json({ 'modelo-a': 'Marca A', 'modelo-b': 'Marca B' }) },
};

let turnstileOk = true;
let enviados: { to: { email: string }[]; subject: string; htmlContent: string; textContent: string }[] = [];
let pendientes: Promise<unknown>[] = [];

beforeEach(() => {
  estado.tablas = { alertas: [], precios_ultimos_dos: [] };
  estado.rpc = [];
  turnstileOk = true;
  enviados = [];
  pendientes = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      if (url.includes('turnstile')) return Response.json({ success: turnstileOk });
      if (url.includes('brevo')) {
        enviados.push(...JSON.parse(String(init.body)).messageVersions);
        return Response.json({ messageId: 'x' }, { status: 201 });
      }
      throw new Error(`fetch inesperado: ${url}`);
    }),
  );
});

const valido = { email: 'Ana@Ejemplo.mx', slug: 'modelo-a', precioObjetivo: 9000, consentimiento: true, turnstile: 'tok' };

async function post(body: unknown, headers: Record<string, string> = {}, method = 'POST') {
  const request = new Request(`${ORIGEN}/api/alertas`, {
    method,
    headers: { Origin: ORIGEN, 'Content-Type': 'application/json', ...headers },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const r = await suscribir({ request, env: ENV, waitUntil: (p) => pendientes.push(p) });
  await Promise.all(pendientes);
  return r;
}

const tokenDe = (texto: string, ruta: string) => texto.match(new RegExp(`${ruta}\\?t=([\\w-]+)`))![1];

describe('POST /api/alertas', () => {
  it('método distinto de POST → 405', async () => {
    const r = await post(null, {}, 'GET');
    expect(r.status).toBe(405);
    expect(r.headers.get('Allow')).toBe('POST');
  });

  it('otro origen → 403', async () => {
    expect((await post(valido, { Origin: 'https://malo.test' })).status).toBe(403);
  });

  it.each([
    ['JSON roto', '{'],
    ['email inválido', { ...valido, email: 'no-es-email' }],
    ['campo extra', { ...valido, admin: true }],
    ['precio fuera de rango', { ...valido, precioObjetivo: 200_001 }],
    ['precio decimal', { ...valido, precioObjetivo: 99.5 }],
    ['slug con ruta', { ...valido, slug: '../admin' }],
    ['sin consentimiento', { ...valido, consentimiento: false }],
    ['consentimiento ausente', { email: valido.email, slug: valido.slug, precioObjetivo: null, turnstile: 'tok' }],
    ['sin token de Turnstile', { ...valido, turnstile: '' }],
  ])('%s → 400 y no guarda nada', async (_, body) => {
    expect((await post(body)).status).toBe(400);
    expect(estado.tablas.alertas).toEqual([]);
  });

  it('modelo que no está en el catálogo → 400', async () => {
    expect((await post({ ...valido, slug: 'no-existe' })).status).toBe(400);
  });

  it('body enorme → 413', async () => {
    expect((await post({ ...valido, turnstile: 'x'.repeat(20_000) })).status).toBe(413);
  });

  it('Turnstile inválido → 403 y no guarda ni envía', async () => {
    turnstileOk = false;
    expect((await post(valido)).status).toBe(403);
    expect(estado.tablas.alertas).toEqual([]);
    expect(enviados).toEqual([]);
  });

  it('sin secretos configurados → 500 genérico', async () => {
    const request = new Request(`${ORIGEN}/api/alertas`, { method: 'POST', headers: { Origin: ORIGEN }, body: JSON.stringify(valido) });
    const r = await suscribir({ request, env: {}, waitUntil: () => {} });
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: 'No disponible' });
  });

  it('email nuevo: guarda sin confirmar con el hash del token y envía la confirmación', async () => {
    const r = await post(valido);
    expect(r.status).toBe(202);
    const [fila] = estado.tablas.alertas;
    expect(fila).toMatchObject({ email: 'ana@ejemplo.mx', scooter_slug: 'modelo-a', precio_objetivo: 9000, confirmado: false });
    expect(enviados).toHaveLength(1);
    expect(enviados[0].to).toEqual([{ email: 'ana@ejemplo.mx' }]);
    const token = tokenDe(enviados[0].textContent, '/api/alertas/confirmar');
    expect(token).toHaveLength(43);
    expect(fila.token_hash).toBe(sha(token));
    expect(JSON.stringify(estado.tablas)).not.toContain(token); // el token nunca se guarda en claro
  });

  it('email existente y nuevo dan exactamente la misma respuesta', async () => {
    const nuevo = await post(valido);
    estado.tablas.alertas[0].confirmado = true;
    const existente = await post(valido);
    expect(existente.status).toBe(nuevo.status);
    expect(await existente.text()).toBe(await nuevo.text());
    expect(enviados).toHaveLength(1); // al existente no se le reenvía nada
    expect(estado.tablas.alertas).toHaveLength(1);
  });

  it('pedirla dos veces seguidas sin confirmar no reenvía el correo', async () => {
    await post(valido);
    await post(valido);
    expect(enviados).toHaveLength(1);
  });
});

describe('confirmar y baja', () => {
  beforeEach(() => {
    estado.tablas.alertas = [
      { id: 1, email: 'a@a.mx', scooter_slug: 'modelo-a', confirmado: false, token_hash: sha('A'.repeat(43)) },
      { id: 2, email: 'b@b.mx', scooter_slug: 'modelo-a', confirmado: false, token_hash: sha('B'.repeat(43)) },
    ];
  });
  const get = (fn: typeof confirmar, ruta: string, t: string, method = 'GET') =>
    fn({ request: new Request(`${ORIGEN}/api/alertas/${ruta}?t=${t}`, { method }), env: ENV });

  it('método distinto de GET → 405', async () => {
    expect((await get(confirmar, 'confirmar', 'A'.repeat(43), 'POST')).status).toBe(405);
    expect((await get(baja, 'baja', 'A'.repeat(43), 'DELETE')).status).toBe(405);
  });

  it.each(['C'.repeat(43), 'corto', sha('A'.repeat(43)), ''])('token falso o mal formado (%s) no hace nada y responde igual', async (t) => {
    const antes = JSON.stringify(estado.tablas.alertas);
    const c = await get(confirmar, 'confirmar', t);
    const b = await get(baja, 'baja', t);
    expect(JSON.stringify(estado.tablas.alertas)).toBe(antes);
    expect([c.status, c.headers.get('Location')]).toEqual([303, '/alertas/confirmada']);
    expect([b.status, b.headers.get('Location')]).toEqual([303, '/alertas/baja']);
  });

  it('el token de un suscriptor solo toca su fila', async () => {
    await get(confirmar, 'confirmar', 'A'.repeat(43));
    expect(estado.tablas.alertas.map((a) => a.confirmado)).toEqual([true, false]);
    await get(baja, 'baja', 'A'.repeat(43));
    expect(estado.tablas.alertas.map((a) => a.id)).toEqual([2]);
  });
});

const alerta = (id: number, precio_objetivo: number | null, ultimo_aviso_mxn: number | null = null, confirmado = true) => ({
  id, email: `${id}@x.mx`, scooter_slug: 'modelo-a', precio_objetivo, ultimo_aviso_mxn, confirmado, token_hash: 'h',
});
const precio = (precio_mxn: number, n: number, disponible = true) => ({
  scooter_slug: 'modelo-a', precio_mxn, disponible, verificado_en: '2026-10-29T15:00:00Z', n,
});

describe('precioParaAvisar', () => {
  const a = (o: Partial<Alerta>): Alerta => ({ id: 1, email: 'a@a.mx', scooter_slug: 'm', precio_objetivo: null, ultimo_aviso_mxn: null, ...o });
  const p = (precio_mxn: number, disponible = true) => ({ precio_mxn, disponible, verificado_en: '2026-10-29T15:00:00Z' });

  it('con objetivo: avisa en o bajo el objetivo', () => {
    expect(precioParaAvisar(a({ precio_objetivo: 9000 }), p(9000))).toBe(9000);
    expect(precioParaAvisar(a({ precio_objetivo: 9000 }), p(9001))).toBeNull();
  });
  it('sin objetivo: avisa solo si bajó respecto a la captura anterior', () => {
    expect(precioParaAvisar(a({}), p(8000), p(9000))).toBe(8000);
    expect(precioParaAvisar(a({}), p(9000), p(9000))).toBeNull();
    expect(precioParaAvisar(a({}), p(8000))).toBeNull();
  });
  it('nunca repite el mismo precio ni avisa de un modelo agotado o sin precio', () => {
    expect(precioParaAvisar(a({ precio_objetivo: 9000, ultimo_aviso_mxn: 8500 }), p(8500))).toBeNull();
    expect(precioParaAvisar(a({ precio_objetivo: 9000 }), p(8500, false))).toBeNull();
    expect(precioParaAvisar(a({ precio_objetivo: 9000 }), undefined)).toBeNull();
  });
});

describe('enviarAvisos (tras publicar)', () => {
  it('avisa solo a las confirmadas que toca, rota su token y no repite el mismo precio', async () => {
    estado.tablas.alertas = [alerta(1, 9000), alerta(2, null), alerta(3, 8000), alerta(4, 9000, 8500), alerta(5, 9000, null, false)];
    estado.tablas.precios_ultimos_dos = [precio(8500, 1), precio(9500, 2)];
    const sb = supabaseAdmin(ENV)!;

    expect(await enviarAvisos(sb, ENV, ORIGEN)).toBe(2);
    expect(enviados.map((m) => m.to[0].email)).toEqual(['1@x.mx', '2@x.mx']);
    for (const m of enviados) {
      expect(m.textContent).toContain(`${ORIGEN}/scooter/modelo-a`);
      const token = tokenDe(m.textContent, '/api/alertas/baja');
      expect(estado.tablas.alertas.find((a) => a.email === m.to[0].email)!.token_hash).toBe(sha(token));
    }
    expect(estado.tablas.alertas.map((a) => a.ultimo_aviso_mxn)).toEqual([8500, 8500, null, 8500, null]);

    enviados = [];
    expect(await enviarAvisos(sb, ENV, ORIGEN)).toBe(0);
    expect(enviados).toEqual([]);
  });

  it('sin Brevo configurado no envía ni registra nada', async () => {
    estado.tablas.alertas = [alerta(1, 9000)];
    estado.tablas.precios_ultimos_dos = [precio(8500, 1)];
    expect(await enviarAvisos(supabaseAdmin(ENV)!, { ...ENV, BREVO_API_KEY: undefined }, ORIGEN)).toBe(0);
    expect(estado.rpc).toEqual([]);
  });
});

describe('emails', () => {
  const enlaces = { origen: ORIGEN, slug: 'modelo-a', token: 'T'.repeat(43) };
  const emails = [
    emailConfirmacion('a@a.mx', 'Marca A', 9000, enlaces),
    emailConfirmacion('a@a.mx', 'Marca A', null, enlaces),
    emailAviso('a@a.mx', 'Marca A', { precio_mxn: 8500, disponible: true, verificado_en: '2026-10-29T15:00:00Z' }, enlaces),
  ];

  it('nunca contienen links de afiliado ni mencionan Mercado Libre', () => {
    for (const e of emails) expect(JSON.stringify(e)).not.toMatch(/mercado\s*libre|mercadolibre|meli|mlstatic/i);
  });

  it('todos los enlaces van a la web, con baja en un clic', () => {
    for (const e of emails) {
      const urls = [...`${e.texto} ${e.html}`.matchAll(/https?:\/\/[^\s"<]+/g)].map((m) => m[0]);
      expect(urls.length).toBeGreaterThan(0);
      expect(urls.every((u) => u.startsWith(`${ORIGEN}/`))).toBe(true);
      expect(e.texto).toContain(`${ORIGEN}/api/alertas/baja?t=`);
    }
  });

  it('el aviso lleva la fecha de verificación del precio', () => {
    expect(emails[2].texto).toContain('$8,500');
    expect(emails[2].texto).toMatch(/verificado el 29 oct 2026/);
  });

  it('escapa el HTML', () => {
    expect(emailConfirmacion('a@a.mx', '<b>X</b>', null, enlaces).html).not.toContain('<b>X</b>');
  });
});
