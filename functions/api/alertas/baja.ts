import { porToken, type EnvAlertas } from '../../_lib/alertas';

// GET /api/alertas/baja?t=<token>: baja en un clic, borra la fila. Token inválido o ajeno = misma respuesta y no borra nada.
export const onRequest = ({ request, env }: { request: Request; env: EnvAlertas }) =>
  porToken(request, env, (sb, hash) => sb.from('alertas').delete().eq('token_hash', hash), '/alertas/baja');
