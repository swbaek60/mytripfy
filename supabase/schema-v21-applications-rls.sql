-- ============================================================
-- v21: companion_applications RLS 정책 추가
-- 신청자가 자신의 신청을 삭제(취소/재신청)할 수 있도록 허용
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 신청자가 자신의 신청을 삭제할 수 있는 정책 추가
-- (취소, 재신청 시 기존 레코드 삭제에 필요)
DROP POLICY IF EXISTS "applications_delete" ON public.companion_applications;
CREATE POLICY "applications_delete" ON public.companion_applications FOR DELETE
  USING (auth.uid() = applicant_id);

-- CHECK 제약 조건에 'removed' 추가 (v20과 동일, 아직 실행 안 했다면 여기서 함께 실행)
ALTER TABLE public.companion_applications
  DROP CONSTRAINT IF EXISTS companion_applications_status_check;

ALTER TABLE public.companion_applications
  ADD CONSTRAINT companion_applications_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'removed'));
