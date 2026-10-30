import { z } from 'astro/zod';
import { emailConfirmacion } from '../../../src/lib/alertas';
import { PRECIO_MAX } from '../../../src/lib/precios';
import { enviarEmails, json, sinDatos, nombresModelos, nuevoToken, supabaseAdmin, turnstileValido, type EnvAlertas } from '../../_lib/alertas';

// POST /api/alertas: suscribe un email a la alerta de precio de un modelo (doble opt-in).
// Orden de docs/seguridad.md §3. Rate limit por IP: regla de Cloudflare (docs/alertas.md); por email, aquí abajo.
// Siempre la misma respuesta exista o no el email (§6: sin enumeración).

const esquema = z.strictObject({
  email: z.email().max(254),
  slug: z.string().max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  precioObjetivo: z.number().int().min(1).max(PRECIO_MAX).nullable(),
  consentimiento: z.literal(true),
  turnstile: z.string().min(1).max(2048),
});

const MAX_BODY = 10_000;
// Contra el bombardeo de correos a un tercero: pocas alertas sin confirmar y un reenvío al día como mucho.
const MAX_ALERTAS_POR_EMAIL = 20;
const MAX_PENDIENTES_POR_EMAIL = 3;
const REENVIO_MS = 24 * 60 * 60 * 1000;
const OK = { ok: true, mensaje: 'Si el correo es válido, te enviamos un enlace para confirmar la alerta.' };

type Contexto = { request: Request; env: EnvAlertas; waitUntil: (p: Promise<unknown>) => void };

export async function onRequest({ request, env, waitUntil }: Contexto): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'Método no permitido' }, { Allow: 'POST' });
  const origen = new URL(request.url).origin;
  if (request.headers.get('Origin') !== origen) return json(403, { error: 'Origen no permitido' });
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY) return json(413, { error: 'Demasiado grande' });
  const texto = await request.text();
  if (texto.length > MAX_BODY) return json(413, { error: 'Demasiado grande' });

  let datos: z.infer<typeof esquema>;
  try {
    datos = esquema.parse(JSON.parse(texto));
  } catch {
    return json(400, { error: 'Datos inválidos' });
  }

  const supabase = supabaseAdmin(env);
  if (!supabase || !env.TURNSTILE_SECRET_KEY || !env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL || !env.ASSETS) {
    console.error('[alertas] Faltan variables: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET_KEY, BREVO_API_KEY o BREVO_SENDER_EMAIL');
    return json(500, { error: 'No disponible' });
  }

  try {
    if (!(await turnstileValido(env.TURNSTILE_SECRET_KEY, datos.turnstile, request.headers.get('CF-Connecting-IP')))) {
      return json(403, { error: 'Verificación fallida' });
    }
    const nombre = (await nombresModelos(env, origen))[datos.slug];
    if (!nombre) return json(400, { error: 'Datos inválidos' });

    const email = datos.email.toLowerCase();
    const existente = await supabase
      .from('alertas')
      .select('id, confirmado, creado_en')
      .eq('email', email)
      .eq('scooter_slug', datos.slug)
      .maybeSingle();
    if (existente.error) throw existente.error;

    const { token, hash } = await nuevoToken();
    const fila = { token_hash: hash, precio_objetivo: datos.precioObjetivo };
    let enviar = false;
    if (!existente.data) {
      const { data: suyas, error } = await supabase.from('alertas').select('confirmado').eq('email', email);
      if (error) throw error;
      if (suyas.length < MAX_ALERTAS_POR_EMAIL && suyas.filter((a) => !a.confirmado).length < MAX_PENDIENTES_POR_EMAIL) {
        const alta = await supabase.from('alertas').insert({ ...fila, email, scooter_slug: datos.slug });
        if (alta.error) throw alta.error;
        enviar = true;
      }
    } else if (!existente.data.confirmado && Date.now() - Date.parse(existente.data.creado_en) > REENVIO_MS) {
      // Sin confirmar y hace rato: nuevo enlace (el anterior deja de valer).
      const cambio = await supabase.from('alertas').update({ ...fila, creado_en: new Date().toISOString() }).eq('id', existente.data.id);
      if (cambio.error) throw cambio.error;
      enviar = true;
    }
    // Ya confirmada o pedida hace poco: no se toca ni se reenvía.

    // El envío va fuera de la respuesta: el tiempo de respuesta no delata si el email ya existía.
    if (enviar) {
      const mensaje = emailConfirmacion(email, nombre, datos.precioObjetivo, { origen, slug: datos.slug, token });
      waitUntil(enviarEmails(env, [mensaje]).catch((e) => console.error('[alertas] Brevo', e)));
    }
    return json(202, OK);
  } catch (e) {
    console.error('[alertas]', sinDatos(e));
    return json(500, { error: 'No disponible' });
  }
}
