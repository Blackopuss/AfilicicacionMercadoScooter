import { porToken, type EnvAlertas } from '../../_lib/alertas';

// POST /api/alertas/confirmar (body t=<token>, desde /alertas/confirmar/): doble opt-in. Token inválido o ajeno = misma
// respuesta y no cambia nada. GET (enlaces viejos) solo redirige a la página del botón.
export const onRequest = ({ request, env }: { request: Request; env: EnvAlertas }) =>
  porToken(request, env, (sb, hash) => sb.from('alertas').update({ confirmado: true }).eq('token_hash', hash), '/alertas/confirmar/', '/alertas/confirmada');
