-- Pruebas de 0002_alertas_avisos.sql (pgTAP, `supabase test db`): lo nuevo sigue cerrado a anon y authenticated.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select ok((select 'security_invoker=true' = any(reloptions) from pg_class where oid = 'public.precios_ultimos_dos'::regclass), 'precios_ultimos_dos: security_invoker');
select ok(not has_function_privilege('anon', 'public.registrar_avisos(bigint[], text[], integer[])', 'execute'), 'anon no ejecuta registrar_avisos');
select ok(not has_function_privilege('authenticated', 'public.registrar_avisos(bigint[], text[], integer[])', 'execute'), 'authenticated no ejecuta registrar_avisos');
select ok(has_function_privilege('service_role', 'public.registrar_avisos(bigint[], text[], integer[])', 'execute'), 'service_role ejecuta registrar_avisos');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select * from public.precios_ultimos_dos$$, '42501', null, 'anon no lee precios_ultimos_dos');

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","aal":"aal2","app_metadata":{"role":"admin"}}';
select throws_ok($$select public.registrar_avisos(array[1]::bigint[], array[repeat('a', 64)], array[1])$$, '42501', null, 'ni el admin registra avisos con su JWT');
select throws_ok($$insert into public.alertas (email, scooter_slug, token_hash) values ('a@b.mx', 'modelo-a', repeat('b', 64))$$, '42501', null, 'ni el admin crea alertas sin objetivo con su JWT');

select * from finish();
rollback;
