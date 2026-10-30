import { createClient } from '@supabase/supabase-js';
import { enviarAvisos, type EnvAlertas } from '../_lib/alertas';

// POST /api/publicar: registra la publicación en auditoria y dispara el deploy hook de Cloudflare Pages.
// Después avisa a las alertas de precio (functions/_lib/alertas.ts).
// Comprobaciones en el orden de docs/seguridad.md §3. El body no se lee: este endpoint no recibe datos.
export type Env = EnvAlertas & {
  PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string; // secreto de Cloudflare
  CF_DEPLOY_HOOK_URL?: string; // secreto de Cloudflare
};

const JWT = /^Bearer ([\w-]+\.([\w-]+)\.[\w-]+)$/;

function respuesta(status: number, body: object, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}
const fallo = (status: number, error: string) => respuesta(status, { error });

export async function onRequest({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (request.method !== 'POST') return respuesta(405, { error: 'Método no permitido' }, { Allow: 'POST' });
  // Solo el propio sitio (el panel hace fetch same-origin); sin CORS.
  if (request.headers.get('Origin') !== new URL(request.url).origin) return fallo(403, 'Origen no permitido');

  const jwt = request.headers.get('Authorization')?.match(JWT);
  if (!jwt) return fallo(401, 'No autenticado');

  const { PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey, CF_DEPLOY_HOOK_URL: hook } = env;
  if (!url || !serviceKey || !hook) {
    console.error('[publicar] Faltan PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o CF_DEPLOY_HOOK_URL');
    return fallo(500, 'No disponible');
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    // El servidor de Auth verifica firma, caducidad y que la sesión siga viva.
    const { data, error } = await supabase.auth.getUser(jwt[1]);
    if (error || !data.user) return fallo(401, 'No autenticado');
    // Ya verificado, se leen sus claims: el rol sale de app_metadata (solo editable en el servidor).
    const claims = JSON.parse(atob(jwt[2].replace(/-/g, '+').replace(/_/g, '/')));
    if (data.user.app_metadata?.role !== 'admin' || claims.aal !== 'aal2') return fallo(403, 'Sin permiso');

    // Precios capturados desde la publicación anterior.
    const anterior = await supabase
      .from('auditoria')
      .select('creado_en')
      .eq('accion', 'publicar')
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (anterior.error) throw anterior.error;
    let consulta = supabase.from('precios').select('id', { count: 'exact', head: true });
    if (anterior.data) consulta = consulta.gt('verificado_en', anterior.data.creado_en);
    const { count, error: errorConteo } = await consulta;
    if (errorConteo) throw errorConteo;

    // Primero el registro: nunca se publica sin dejar rastro.
    const registro = await supabase
      .from('auditoria')
      .insert({ usuario_id: data.user.id, accion: 'publicar', precios_cambiados: count ?? 0 });
    if (registro.error) throw registro.error;

    const deploy = await fetch(hook, { method: 'POST' });
    if (!deploy.ok) throw new Error(`deploy hook respondió ${deploy.status}`);

    // Lo publicado ya quedó: un fallo de los avisos solo se registra.
    let avisos = 0;
    try {
      avisos = await enviarAvisos(supabase, env, new URL(request.url).origin);
    } catch (e) {
      console.error('[publicar] avisos', e);
    }
    return respuesta(200, { ok: true, preciosCambiados: count ?? 0, avisos });
  } catch (e) {
    console.error('[publicar]', e);
    return fallo(500, 'No se pudo publicar');
  }
}
