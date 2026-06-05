-- ============================================================
-- Supabase Breaking Change 대응: Data API 테이블 권한 명시화
-- Ref: https://github.com/orgs/supabase/discussions/45329
--
-- 배경:
--   2026-10-30부터 기존 프로젝트에서도 새로 생성되는 public 스키마
--   테이블에 자동 GRANT가 부여되지 않음.
--   명시적 GRANT 없이 테이블을 생성하면 PostgREST/supabase-js에서 접근 불가.
--
-- 이 마이그레이션이 하는 일:
--   1. 향후 생성 테이블에 자동 그랜트 비활성화 (새 기본값 선제 적용)
--   2. 기존 테이블 전체에 명시적 GRANT 재확인
--   3. oauth_flow_verifier (서버 전용) anon/authenticated 접근 차단
-- ============================================================

-- ── 1. 향후 생성될 테이블에 자동 GRANT 비활성화 ──────────────────
--    (기존 테이블에는 영향 없음 - 기존 grants 그대로 유지)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;

-- ── 2. 기존 테이블 명시적 GRANT (안전망) ──────────────────────────
--    RLS가 실제 행 수준 접근을 제어하므로, GRANT는 테이블 가시성만 허용.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO authenticated, service_role;

-- anon 역할: SELECT만 허용 (INSERT/UPDATE/DELETE는 RLS 정책으로 추가 제어)
GRANT SELECT
  ON ALL TABLES IN SCHEMA public
  TO anon;

-- 시퀀스 (auto-increment ID 등)
GRANT USAGE, SELECT
  ON ALL SEQUENCES IN SCHEMA public
  TO authenticated, service_role;

-- ── 3. 서버 전용 테이블 권한 제한 ────────────────────────────────
--    oauth_flow_verifier: PKCE code_verifier 임시 저장소, 서버(service_role)만 접근
REVOKE ALL ON TABLE public.oauth_flow_verifier FROM anon, authenticated;

-- ============================================================
-- 향후 새 테이블 생성 시 반드시 아래 패턴을 마이그레이션에 포함:
--
-- CREATE TABLE public.new_table (...);
-- ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
--
-- -- 공개 읽기 가능 테이블:
-- GRANT SELECT ON public.new_table TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.new_table TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.new_table TO service_role;
--
-- -- 서버 전용 테이블 (클라이언트 접근 불필요):
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.new_table TO service_role;
-- (anon, authenticated에는 GRANT 하지 않음)
--
-- CREATE POLICY ... ON public.new_table ...;
-- ============================================================
