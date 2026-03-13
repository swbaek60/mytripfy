-- 거절(rejected) 또는 제거(removed) 후 재신청 시 upsert가 UPDATE로 동작하는데,
-- 기존 UPDATE 정책은 호스트만 허용해서 신청자가 RLS에 막히는 문제 해결.
-- 신청자가 본인 행을 rejected/removed → pending 으로만 바꿀 수 있도록 정책 추가.

CREATE POLICY "applications_update_applicant_reapply" ON public.companion_applications
  FOR UPDATE
  USING (
    auth.uid() = applicant_id
    AND status IN ('rejected', 'removed')
  )
  WITH CHECK (auth.uid() = applicant_id);
