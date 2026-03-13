-- ============================================================
-- v20: companion_applications 에 'removed' 상태 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- companion_applications.status CHECK 제약 조건을 'removed' 포함하도록 수정
ALTER TABLE public.companion_applications
  DROP CONSTRAINT IF EXISTS companion_applications_status_check;

ALTER TABLE public.companion_applications
  ADD CONSTRAINT companion_applications_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'removed'));
