import { porToken, type EnvAlertas } from '../../_lib/alertas';

// GET /api/alertas/confirmar?t=<token>: doble opt-in. Token inválido o ajeno = misma respuesta y no cambia nada.
export const onRequest = ({ request, env }: { request: Request; env: EnvAlertas }) =>
  porToken(request, env, (sb, hash) => sb.from('alertas').update({ confirmado: true }).eq('token_hash', hash), '/alertas/confirmada');
