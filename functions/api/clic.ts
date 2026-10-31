import { z } from 'astro/zod';
import { LUGARES_CLIC } from '../../src/lib/clics';
import { json, nombresModelos, sinDatos, supabaseAdmin, type EnvAlertas } from '../_lib/alertas';

// POST /api/clic: suma un clic anónimo al contador del día (lo manda navigator.sendBeacon al abrir un link de afiliado).
// Orden de docs/seguridad.md §3. Sin datos personales: ni IP, ni cookies, ni identificadores; solo modelo y lugar.
// Abuso: la tabla no crece por clic (sumar_clic hace upsert); inflar el contador es posible hasta que haya rate limit.

const esquema = z.strictObject({
  slug: z.string().max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  lugar: z.enum(LUGARES_CLIC),
});

const MAX_BODY = 200; // {"slug":"…","lugar":"…"} cabe de sobra

type Contexto = { request: Request; env: EnvAlertas };

export async function onRequest({ request, env }: Contexto): Promise<Response> {
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
  if (!supabase || !env.ASSETS) {
    console.error('[clic] Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    return json(500, { error: 'No disponible' });
  }

  try {
    // hasOwn: "constructor" pasa la regex y existe en el prototipo de cualquier objeto.
    if (!Object.hasOwn(await nombresModelos(env, origen), datos.slug)) return json(400, { error: 'Datos inválidos' });
    const { error } = await supabase.rpc('sumar_clic', { slug: datos.slug, lugar: datos.lugar });
    if (error) throw error;
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[clic]', sinDatos(e));
    return json(500, { error: 'No disponible' });
  }
}
