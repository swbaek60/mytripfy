-- 데이터베이스 잠금: 브라우저의 직접 접근을 완전히 차단한다.
--
-- 배경
--   기존에는 거의 모든 테이블에 `open_all_access` (USING true) 정책이 걸려 있고
--   anon / authenticated 롤에 전체 권한이 부여되어 있었다. 공개된 anon 키만 있으면
--   누구나 profiles·messages·notifications 를 읽고 심지어 삭제할 수 있는 상태였다.
--
-- 새 구조
--   브라우저는 Supabase 에 직접 붙지 않는다. 모든 읽기·쓰기는 Next.js 서버
--   (Route Handler / 서버 컴포넌트)를 거치고, 서버는 service_role 키로 접근하면서
--   코드에서 소유권·검증·rate limit 을 담당한다. service_role 은 BYPASSRLS 이므로
--   정책을 모두 제거해도 서버 동작에는 영향이 없다.
--
--   따라서 public 스키마는 "RLS 켜짐 + 정책 없음 + anon/authenticated 권한 없음"
--   상태로 만든다. 정책과 권한 중 하나만 남아도 열리지 않는 이중 방어다.

-- 1) public 스키마의 모든 RLS 정책 제거
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- 2) public 스키마의 모든 테이블에 RLS 강제 (정책이 없으므로 = 전면 차단)
do $$
declare
  rel record;
begin
  for rel in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', rel.relname);
  end loop;
end $$;

-- 3) anon / authenticated 권한 회수
--    PostgREST 가 스키마 자체에 접근하지 못하게 usage 까지 회수한다.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke all on all routines in schema public from anon, authenticated;
revoke usage on schema public from anon, authenticated;

-- 4) 앞으로 만들어질 객체에도 같은 규칙을 적용한다.
--    (Supabase 는 기본적으로 anon/authenticated 에 권한을 부여하도록 설정되어 있다)
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- 5) 스토리지: 쓰기는 서버만, 읽기는 공개
--    open_all_storage 정책 때문에 익명 사용자가 남의 사진을 지울 수 있었다.
--    업로드/삭제는 모두 /api/storage/upload 를 거치므로 쓰기 정책은 필요 없다.
drop policy if exists "open_all_storage" on storage.objects;

drop policy if exists "avatars: auth upload" on storage.objects;
drop policy if exists "avatars: owner delete" on storage.objects;
drop policy if exists "avatars: owner update" on storage.objects;
drop policy if exists "certifications: auth upload" on storage.objects;
drop policy if exists "certifications: owner delete" on storage.objects;
drop policy if exists "guide-media: auth upload" on storage.objects;
drop policy if exists "guide-media: owner delete" on storage.objects;
drop policy if exists "guide-media: owner update" on storage.objects;
drop policy if exists "photos: auth upload" on storage.objects;
drop policy if exists "photos: owner delete" on storage.objects;
drop policy if exists "photos: owner update" on storage.objects;

-- 공개 읽기만 남긴다 (이미지가 <img src> 로 바로 로드되어야 한다).
drop policy if exists "avatars: public read" on storage.objects;
drop policy if exists "certifications: public read" on storage.objects;
drop policy if exists "guide-media: public read" on storage.objects;
drop policy if exists "photos: public read" on storage.objects;

create policy "public buckets are readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('avatars', 'certifications', 'guide-media', 'photos', 'sns'));

-- 6) 더 이상 쓰지 않는 레거시 테이블 제거
--    Supabase OAuth PKCE 흐름용이었으나 Clerk 전환으로 라우트까지 삭제되었다.
drop table if exists public.oauth_flow_verifier;
