-- Pruebas de 0003_clics.sql (pgTAP, `supabase test db`): el contador no crece por clic y solo el admin aal2 lo lee.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.clics_diarios'::regclass), 'clics_diarios: RLS forzado');
select ok(not has_function_privilege('anon', 'public.sumar_clic(text, text)', 'execute'), 'anon no ejecuta sumar_clic');
select ok(not has_function_privilege('authenticated', 'public.sumar_clic(text, text)', 'execute'), 'authenticated no ejecuta sumar_clic');
select ok(has_function_privilege('service_role', 'public.sumar_clic(text, text)', 'execute'), 'service_role ejecuta sumar_clic');

-- functions/ (service key): cada clic suma al contador del día, sin filas nuevas
set local role service_role;
select public.sumar_clic('modelo-a', 'ficha');
select public.sumar_clic('modelo-a', 'ficha');
select public.sumar_clic('modelo-a', 'comparar');
select results_eq($$select lugar, total from public.clics_diarios order by lugar$$,
  $$values ('comparar', 1::bigint), ('ficha', 2::bigint)$$, 'tres clics: dos filas, ficha suma 2');
select throws_ok($$select public.sumar_clic('modelo-a', 'otro')$$, '23514', null, 'lugar fuera de la lista rechazado');
select throws_ok($$select public.sumar_clic('Modelo A', 'ficha')$$, '23514', null, 'slug inválido rechazado');

-- Anon: nada
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select * from public.clics_diarios$$, '42501', null, 'anon no lee clics');
select throws_ok($$insert into public.clics_diarios (dia, scooter_slug, lugar, total) values (current_date, 'modelo-a', 'ficha', 99)$$, '42501', null, 'anon no escribe clics');
select throws_ok($$select public.sumar_clic('modelo-a', 'ficha')$$, '42501', null, 'anon no suma clics');

-- Autenticado sin rol admin, o admin sin MFA: no ve filas
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","aal":"aal2","app_metadata":{},"user_metadata":{"role":"admin"}}';
select is((select count(*) from public.clics_diarios), 0::bigint, 'no admin no lee clics');
set local request.jwt.claims = '{"role":"authenticated","aal":"aal1","app_metadata":{"role":"admin"}}';
select is((select count(*) from public.clics_diarios), 0::bigint, 'admin sin MFA no lee clics');

-- Admin con MFA: lee, pero no escribe
set local request.jwt.claims = '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","aal":"aal2","app_metadata":{"role":"admin"}}';
select is((select sum(total) from public.clics_diarios), 3::numeric, 'admin aal2 lee clics');
select throws_ok($$update public.clics_diarios set total = 0$$, '42501', null, 'ni el admin cambia clics con su JWT');
select throws_ok($$select public.sumar_clic('modelo-a', 'ficha')$$, '42501', null, 'ni el admin suma clics con su JWT');

select * from finish();
rollback;
