import { porToken, type EnvAlertas } from '../../_lib/alertas';

// POST /api/alertas/baja (body t=<token>, desde /alertas/dar-de-baja/): borra la fila. Token inválido o ajeno = misma
// respuesta y no borra nada. GET (enlaces viejos) solo redirige a la página del botón.
export const onRequest = ({ request, env }: { request: Request; env: EnvAlertas }) =>
  porToken(request, env, (sb, hash) => sb.from('alertas').delete().eq('token_hash', hash), '/alertas/dar-de-baja/', '/alertas/baja');
