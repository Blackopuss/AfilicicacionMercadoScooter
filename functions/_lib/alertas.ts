import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SITE } from '../../src/config';
import { emailAviso, precioParaAvisar, type Alerta, type Email, type PrecioCapturado } from '../../src/lib/alertas';

// Piezas compartidas por /api/alertas, /api/alertas/confirmar, /api/alertas/baja y /api/publicar.
export type EnvAlertas = {
  PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string; // secreto de Cloudflare
  TURNSTILE_SECRET_KEY?: string; // secreto de Cloudflare
  BREVO_API_KEY?: string; // secreto de Cloudflare
  BREVO_SENDER_EMAIL?: string; // remitente verificado en Brevo
  ASSETS?: { fetch(input: string | URL | Request): Promise<Response> }; // binding de Pages a los archivos estáticos
};

/** Solo el mensaje: el campo details de PostgREST puede llevar el email (sin datos personales en los logs). */
export const sinDatos = (e: unknown) => (e as { message?: unknown } | null)?.message ?? String(e);

export const TOKEN = /^[A-Za-z0-9_-]{43}$/; // 32 bytes en base64url

export function json(status: number, body: object, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

export function supabaseAdmin(env: EnvAlertas): SupabaseClient | null {
  const { PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = env;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export async function sha256Hex(texto: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Token aleatorio de 32 bytes (va en los enlaces) y su hash (lo único que se guarda). */
export async function nuevoToken(): Promise<{ token: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { token, hash: await sha256Hex(token) };
}

/** slug → "Marca Modelo", desde /modelos.json del propio build (nunca de lo que manda el cliente). */
export async function nombresModelos(env: EnvAlertas, origen: string): Promise<Record<string, string>> {
  const r = await env.ASSETS!.fetch(new URL('/modelos.json', origen));
  if (!r.ok) throw new Error(`/modelos.json respondió ${r.status}`);
  return r.json();
}

export async function turnstileValido(secret: string, token: string, ip: string | null): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const v = (await r.json().catch(() => ({}))) as { success?: unknown };
  return v.success === true;
}

/** Envía con Brevo, un mensaje por destinatario (messageVersions), en lotes. */
export async function enviarEmails(env: EnvAlertas, emails: Email[]): Promise<void> {
  for (let i = 0; i < emails.length; i += 500) {
    const lote = emails.slice(i, i + 500);
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY!, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: SITE.name, email: env.BREVO_SENDER_EMAIL },
        subject: lote[0].asunto,
        htmlContent: lote[0].html,
        textContent: lote[0].texto,
        messageVersions: lote.map((m) => ({ to: [{ email: m.para }], subject: m.asunto, htmlContent: m.html, textContent: m.texto })),
      }),
    });
    if (!r.ok) throw new Error(`Brevo respondió ${r.status}`);
  }
}

/**
 * Tras publicar: avisa a las alertas confirmadas cuyo precio llegó (ver precioParaAvisar) y lo registra.
 * Primero registra y luego envía: ante un fallo se pierde un aviso, pero nunca se repite.
 */
export async function enviarAvisos(supabase: SupabaseClient, env: EnvAlertas, origen: string): Promise<number> {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL || !env.ASSETS) {
    console.warn('[alertas] Faltan BREVO_API_KEY, BREVO_SENDER_EMAIL o ASSETS: no se envían avisos.');
    return 0;
  }
  // shortcut: lee hasta 1000 alertas (máximo de filas por defecto de la API de Supabase); paginar al pasar de ahí.
  const alertas = await supabase
    .from('alertas')
    .select('id, email, scooter_slug, precio_objetivo, ultimo_aviso_mxn')
    .eq('confirmado', true);
  if (alertas.error) throw alertas.error;
  if (!alertas.data.length) return 0;

  const precios = await supabase.from('precios_ultimos_dos').select('scooter_slug, precio_mxn, disponible, verificado_en, n');
  if (precios.error) throw precios.error;
  const actual = new Map<string, PrecioCapturado>();
  const anterior = new Map<string, PrecioCapturado>();
  for (const f of precios.data) (f.n === 1 ? actual : anterior).set(f.scooter_slug, f);
  const nombres = await nombresModelos(env, origen);

  const avisos: { id: number; hash: string; precio: number; email: Email }[] = [];
  for (const a of alertas.data as Alerta[]) {
    const precio = precioParaAvisar(a, actual.get(a.scooter_slug), anterior.get(a.scooter_slug));
    const nombre = nombres[a.scooter_slug];
    if (precio == null || !nombre) continue;
    // El token rota en cada aviso: solo guardamos su hash, así que el enlace de baja nuevo necesita uno nuevo.
    const { token, hash } = await nuevoToken();
    const email = emailAviso(a.email, nombre, actual.get(a.scooter_slug)!, { origen, slug: a.scooter_slug, token });
    avisos.push({ id: a.id, hash, precio, email });
  }
  if (!avisos.length) return 0;

  const registro = await supabase.rpc('registrar_avisos', {
    ids: avisos.map((a) => a.id),
    hashes: avisos.map((a) => a.hash),
    precios: avisos.map((a) => a.precio),
  });
  if (registro.error) throw registro.error;
  await enviarEmails(env, avisos.map((a) => a.email));
  return avisos.length;
}

const MAX_BODY_TOKEN = 1_000; // "t=" + 43 caracteres; el resto sobra

const redirigir = (Location: string) =>
  new Response(null, { status: 303, headers: { Location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });

/**
 * confirmar y baja. GET no toca nada (los filtros de correo abren los links solos): lleva a la página del botón
 * conservando el token en el fragmento, para los correos ya enviados. POST (el botón): busca por hash del token y
 * siempre responde igual (303 a una página genérica) sea válido o no.
 */
export async function porToken(
  request: Request,
  env: EnvAlertas,
  accion: (supabase: SupabaseClient, hash: string) => PromiseLike<{ error: unknown }>,
  pagina: string,
  destino: string,
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const t = url.searchParams.get('t');
    return redirigir(t && TOKEN.test(t) ? `${pagina}#t=${t}` : pagina);
  }
  if (request.method !== 'POST') return json(405, { error: 'Método no permitido' }, { Allow: 'GET, POST' });
  if (request.headers.get('Origin') !== url.origin) return json(403, { error: 'Origen no permitido' });
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_TOKEN) return json(413, { error: 'Demasiado grande' });
  const texto = await request.text();
  if (texto.length > MAX_BODY_TOKEN) return json(413, { error: 'Demasiado grande' });

  const campos = new URLSearchParams(texto);
  const t = [...campos.keys()].join() === 't' ? campos.get('t') : null; // sin campos extra
  const supabase = supabaseAdmin(env);
  if (!supabase) console.error('[alertas] Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  else if (t && TOKEN.test(t)) {
    const { error } = await accion(supabase, await sha256Hex(t));
    if (error) console.error('[alertas]', sinDatos(error));
  }
  return redirigir(destino);
}
