-- Clics en los links de afiliado (feat/estadisticas-clics): un contador por día, modelo y lugar, sin datos personales.
-- La tabla crece como mucho días × modelos × lugares aunque abusen del endpoint: cada clic solo suma al contador.
-- Seguridad según docs/seguridad.md: RLS forzado, sin acceso con la anon key, lectura solo admin con aal2,
-- escritura solo desde functions/api/clic.ts (service key) con sumar_clic().

create table public.clics_diarios (
  dia date not null,
  scooter_slug public.slug not null,
  -- Misma lista que LUGARES_CLIC en src/lib/clics.ts.
  lugar text not null check (lugar in ('ficha', 'comparar', 'versus', 'mejores', 'portada')),
  total bigint not null default 0 check (total >= 0),
  primary key (dia, scooter_slug, lugar)
);

alter table public.clics_diarios enable row level security;
alter table public.clics_diarios force row level security;

revoke all on public.clics_diarios from anon, authenticated;
grant select on public.clics_diarios to authenticated;

create policy "admin lee clics" on public.clics_diarios
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' and ((select auth.jwt()) ->> 'aal') = 'aal2');

-- Suma un clic al contador de hoy (hora del centro de México). Un upsert: nunca una fila por clic.
create function public.sumar_clic(slug text, lugar text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.clics_diarios as c (dia, scooter_slug, lugar, total)
  values ((now() at time zone 'America/Mexico_City')::date, sumar_clic.slug, sumar_clic.lugar, 1)
  on conflict (dia, scooter_slug, lugar) do update set total = c.total + 1;
$$;
revoke execute on function public.sumar_clic(text, text) from public, anon, authenticated;
grant execute on function public.sumar_clic(text, text) to service_role;
