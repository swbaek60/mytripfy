-- ============================================================
-- v34: companion_applications - 수락된 멤버가 다른 수락된 멤버 목록을 볼 수 있도록 RLS 수정
-- Travel Group에 호스트+수락된 멤버 전체가 표시되려면, 수락된 멤버도 다른 수락된 신청을 조회할 수 있어야 함
-- ============================================================

DROP POLICY IF EXISTS "applications_select" ON public.companion_applications;

CREATE POLICY "applications_select" ON public.companion_applications FOR SELECT
  USING (
    -- 본인 신청: 항상 조회 가능
    auth.uid() = applicant_id
    OR
    -- 게시글 등록자(호스트): 모든 신청 조회 가능
    auth.uid() IN (SELECT user_id FROM public.companion_posts WHERE id = post_id)
    OR
    -- 수락된 멤버: 다른 수락된 멤버들의 신청도 조회 가능 (Travel Group 목록 표시용)
    (
      status = 'accepted'
      AND EXISTS (
        SELECT 1 FROM public.companion_applications a2
        WHERE a2.post_id = companion_applications.post_id
          AND a2.applicant_id = auth.uid()
          AND a2.status = 'accepted'
      )
    )
  );
