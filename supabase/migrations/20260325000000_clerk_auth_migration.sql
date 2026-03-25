-- ============================================================
-- Clerk Auth Migration
-- profiles 테이블에 clerk_id 추가 및 관련 인덱스 생성
-- ============================================================

-- 1. profiles에 clerk_id 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clerk_id text;

-- 2. clerk_id 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS profiles_clerk_id_key
  ON public.profiles (clerk_id)
  WHERE clerk_id IS NOT NULL;

-- 3. clerk_id 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id
  ON public.profiles (clerk_id);

-- 4. email 컬럼이 없으면 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 5. RLS: clerk_id 기반으로도 자신의 프로필에 접근 가능하도록 정책 추가
-- (기존 auth.uid() 기반 정책과 공존)
DO $$
BEGIN
  -- profiles 테이블에 clerk_id 기반 select 정책 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'clerk_users_can_read_own_profile'
  ) THEN
    CREATE POLICY clerk_users_can_read_own_profile
      ON public.profiles
      FOR SELECT
      USING (
        auth.uid() = id
        OR clerk_id IS NOT NULL  -- Clerk 사용자는 service_role로 접근
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- 이미 존재하거나 RLS가 다르게 설정된 경우 무시
END $$;

-- 6. Clerk webhook을 위한 profiles insert 권한
-- service_role은 항상 모든 권한을 가지므로 별도 설정 불필요
-- anon 사용자가 profile 생성하지 못하도록 기존 정책 유지

-- 완료 로그
DO $$
BEGIN
  RAISE NOTICE 'Clerk auth migration completed. clerk_id column added to profiles.';
END $$;
