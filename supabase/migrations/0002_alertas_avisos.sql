-- Alertas de precio (feat/alertas-popup): objetivo opcional y registro del último aviso enviado.
-- Seguridad igual que 0001: alertas sigue sin ninguna política (solo functions/ con la service key).

-- Sin objetivo = avisar cada vez que el precio baje.
alter table public.alertas alter column precio_objetivo drop not null;
-- Precio del último aviso enviado: no se repite el mismo precio dos veces.
alter table public.alertas add column ultimo_aviso_mxn integer check (ultimo_aviso_mxn between 1 and 200000);

-- Los dos últimos precios de cada modelo, para saber si bajó. security_invoker: aplica el RLS de precios.
create view public.precios_ultimos_dos with (security_invoker = true) as
  select scooter_slug, precio_mxn, disponible, verificado_en, n
  from (
    select scooter_slug, precio_mxn, disponible, verificado_en,
      row_number() over (partition by scooter_slug order by verificado_en desc, id desc) as n
    from public.precios
  ) t
  where n <= 2;
revoke all on public.precios_ultimos_dos from anon, authenticated;

-- Registra en una sola llamada los avisos enviados: rota el token (el enlace de baja del email nuevo) y guarda el precio.
create function public.registrar_avisos(ids bigint[], hashes text[], precios integer[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.alertas a
  set token_hash = v.h, ultimo_aviso_mxn = v.p
  from unnest(ids, hashes, precios) as v(id, h, p)
  where a.id = v.id and a.confirmado;
$$;
revoke execute on function public.registrar_avisos(bigint[], text[], integer[]) from public, anon, authenticated;
grant execute on function public.registrar_avisos(bigint[], text[], integer[]) to service_role;
