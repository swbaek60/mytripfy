-- SECURITY DEFINER 함수의 PUBLIC 실행 권한 회수
--
-- 앞선 마이그레이션에서 anon / authenticated 롤의 권한은 회수했지만,
-- 대부분의 함수는 PUBLIC 의사(pseudo) 롤에 EXECUTE 가 부여되어 있어서
-- 여전히 /rest/v1/rpc/... 로 호출 가능한 상태로 남아 있었다.
-- SECURITY DEFINER 함수라 소유자 권한으로 실행되므로 위험도가 높다.
--
-- 앱의 RPC 호출은 모두 서버(service_role)에서 일어나므로 service_role 에만
-- 실행 권한을 남긴다.

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure::text as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.sig);
    execute format('grant execute on function %s to service_role', fn.sig);
  end loop;
end $$;

alter default privileges in schema public revoke all on functions from public;
alter default privileges for role postgres in schema public revoke all on functions from public;
