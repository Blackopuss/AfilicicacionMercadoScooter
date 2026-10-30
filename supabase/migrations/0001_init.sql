-- Precios, alertas y auditoría. Las specs de los scooters viven en el repo (src/content/scooters).
-- Seguridad según docs/seguridad.md: RLS activado y forzado, denegar por defecto, escritura solo admin con aal2.

-- Slug = nombre del archivo en src/content/scooters (sin .json).
create domain public.slug as text
  check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(value) <= 80);

-- Historial: cada captura es una fila nueva; nunca se sobrescribe.
create table public.precios (
  id bigint generated always as identity primary key,
  scooter_slug public.slug not null,
  precio_mxn integer not null check (precio_mxn between 1 and 200000),
  disponible boolean not null default true,
  verificado_en timestamptz not null default now()
);
create index precios_slug_fecha_idx on public.precios (scooter_slug, verificado_en desc);

-- Suscriptores a alertas de precio. Solo accesible desde functions/ con la service key.
create table public.alertas (
  id bigint generated always as identity primary key,
  email text not null check (length(email) <= 254 and email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  scooter_slug public.slug not null,
  precio_objetivo integer not null check (precio_objetivo between 1 and 200000),
  confirmado boolean not null default false,
  -- SHA-256 en hex del token aleatorio de 32 bytes de los enlaces de confirmar y darse de baja.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  creado_en timestamptz not null default now(),
  unique (email, scooter_slug)
);

-- Registro de publicaciones: solo inserción y solo desde functions/.
create table public.auditoria (
  id bigint generated always as identity primary key,
  usuario_id uuid not null,
  accion text not null check (length(accion) between 1 and 50),
  precios_cambiados integer not null default 0 check (precios_cambiados >= 0),
  creado_en timestamptz not null default now()
);

-- Último precio de cada modelo. security_invoker: se aplica el RLS de precios de quien consulta.
create view public.precios_actuales with (security_invoker = true) as
  select distinct on (scooter_slug) scooter_slug, precio_mxn, disponible, verificado_en
  from public.precios
  order by scooter_slug, verificado_en desc, id desc;

-- RLS activado y forzado en todas las tablas: sin política, nadie accede.
alter table public.precios enable row level security;
alter table public.precios force row level security;
alter table public.alertas enable row level security;
alter table public.alertas force row level security;
alter table public.auditoria enable row level security;
alter table public.auditoria force row level security;

-- Permisos de tabla: Supabase concede todo a anon y authenticated por defecto; se recorta al mínimo.
revoke all on public.precios, public.alertas, public.auditoria, public.precios_actuales from anon, authenticated;
grant select on public.precios, public.precios_actuales to anon, authenticated;
grant insert, update, delete on public.precios to authenticated;
revoke all on sequence public.alertas_id_seq, public.auditoria_id_seq from anon, authenticated;
revoke all on sequence public.precios_id_seq from anon;
-- Las funciones usan service_role (salta RLS); aun así la auditoría no se puede reescribir.
revoke update, delete, truncate on public.auditoria from service_role;

-- precios: lectura pública, escritura solo admin (app_metadata, editable solo desde el servidor) con MFA (aal2).
create policy "lectura publica de precios" on public.precios
  for select to anon, authenticated
  using (true);

create policy "admin inserta precios" on public.precios
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' and ((select auth.jwt()) ->> 'aal') = 'aal2');

create policy "admin corrige precios" on public.precios
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' and ((select auth.jwt()) ->> 'aal') = 'aal2')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' and ((select auth.jwt()) ->> 'aal') = 'aal2');

create policy "admin borra precios" on public.precios
  for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' and ((select auth.jwt()) ->> 'aal') = 'aal2');

-- alertas y auditoria: ninguna política a propósito (ni anon ni authenticated pueden leer ni escribir).
