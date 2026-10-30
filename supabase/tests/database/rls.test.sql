-- Pruebas de RLS (pgTAP). Se ejecutan con `supabase test db` contra la base local de Supabase.
-- Demuestran que el acceso falla cuando debe (docs/seguridad.md §8).
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- RLS activado y forzado en todas las tablas
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.precios'::regclass), 'precios: RLS forzado');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.alertas'::regclass), 'alertas: RLS forzado');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.auditoria'::regclass), 'auditoria: RLS forzado');
select ok((select 'security_invoker=true' = any(reloptions) from pg_class where oid = 'public.precios_actuales'::regclass), 'precios_actuales: security_invoker');

-- Sesiones simuladas: rol de Postgres + claims del JWT que lee auth.jwt()

-- Admin con MFA: puede escribir (también siembra los datos de prueba)
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","aal":"aal2","app_metadata":{"role":"admin"}}';
select lives_ok($$insert into public.precios (scooter_slug, precio_mxn, verificado_en) values
  ('modelo-a', 9000, now() - interval '1 day'), ('modelo-a', 8500, now()), ('modelo-b', 15000, now())$$,
  'admin aal2 inserta precios');
select lives_ok($$update public.precios set disponible = false where scooter_slug = 'modelo-b'$$, 'admin aal2 corrige precios');
select throws_ok($$insert into public.precios (scooter_slug, precio_mxn) values ('modelo-a', 0)$$, '23514', null, 'precio 0 rechazado');
select throws_ok($$insert into public.precios (scooter_slug, precio_mxn) values ('modelo-a', 200001)$$, '23514', null, 'precio > 200000 rechazado');
select throws_ok($$insert into public.precios (scooter_slug, precio_mxn) values ('Modelo A', 9000)$$, '23514', null, 'slug inválido rechazado');
select throws_ok($$select * from public.alertas$$, '42501', null, 'ni el admin lee alertas con su JWT');
select throws_ok($$select * from public.auditoria$$, '42501', null, 'ni el admin lee auditoria con su JWT');

-- Anon: solo lee precios
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is((select count(*) from public.precios), 3::bigint, 'anon lee precios');
select results_eq($$select scooter_slug::text, precio_mxn from public.precios_actuales order by 1$$,
  $$values ('modelo-a', 8500), ('modelo-b', 15000)$$, 'precios_actuales da el último precio de cada modelo');
select throws_ok($$insert into public.precios (scooter_slug, precio_mxn) values ('modelo-a', 1)$$, '42501', null, 'anon no inserta precios');
select throws_ok($$delete from public.precios$$, '42501', null, 'anon no borra precios');
select throws_ok($$select * from public.alertas$$, '42501', null, 'anon no lee alertas');
select throws_ok($$insert into public.alertas (email, scooter_slug, precio_objetivo, token_hash) values ('a@b.mx', 'modelo-a', 1, repeat('a', 64))$$, '42501', null, 'anon no escribe alertas');
select throws_ok($$insert into public.auditoria (usuario_id, accion) values (gen_random_uuid(), 'publicar')$$, '42501', null, 'anon no escribe auditoria');

-- Autenticado sin rol admin (o con un rol falso en user_metadata): no escribe
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","aal":"aal2","app_metadata":{},"user_metadata":{"role":"admin"}}';
select throws_ok($$insert into public.precios (scooter_slug, precio_mxn) values ('modelo-a', 1)$$, '42501', null, 'no admin no inserta precios');
delete from public.precios;
update public.precios set precio_mxn = 1;
select throws_ok($$select * from public.alertas$$, '42501', null, 'no admin no lee alertas');

-- Admin sin MFA (aal1): no escribe
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","aal":"aal1","app_metadata":{"role":"admin"}}';
select throws_ok($$insert into public.precios (scooter_slug, precio_mxn) values ('modelo-a', 1)$$, '42501', null, 'admin sin MFA no inserta precios');
delete from public.precios;

-- Lo que intentaron borrar o cambiar los no autorizados sigue intacto
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is((select count(*) from public.precios), 3::bigint, 'no admin ni admin aal1 borraron precios');
select is((select min(precio_mxn) from public.precios), 8500, 'no admin no cambió precios');

-- La auditoría no se puede reescribir ni con la service key
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select throws_ok($$delete from public.auditoria$$, '42501', null, 'service_role no borra auditoria');

select * from finish();
rollback;
