-- ============================================================
-- v42: companion_applications SELECT 정책 무한 재귀 제거
-- v34 정책이 EXISTS(SELECT ... FROM companion_applications)로 같은 테이블을 다시 읽어
-- RLS가 재귀 호출되므로, SECURITY DEFINER 함수로 "현재 사용자가 해당 post 수락 멤버인지"만 검사
-- ============================================================

-- 현재 사용자가 해당 post_id에 대해 수락(accepted)된 신청자인지 반환 (RLS 우회)
CREATE OR REPLACE FUNCTION public.is_accepted_applicant_on_post(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companion_applications
    WHERE post_id = p_post_id
      AND applicant_id = auth.uid()
      AND status = 'accepted'
  );
$$;

DROP POLICY IF EXISTS "applications_select" ON public.companion_applications;

CREATE POLICY "applications_select" ON public.companion_applications FOR SELECT
  USING (
    -- 본인 신청: 항상 조회 가능
    auth.uid() = applicant_id
    OR
    -- 게시글 등록자(호스트): 모든 신청 조회 가능
    auth.uid() IN (SELECT user_id FROM public.companion_posts WHERE id = post_id)
    OR
    -- 수락된 멤버: 같은 post의 다른 수락된 신청도 조회 가능 (Travel Group 목록 표시용, 재귀 없음)
    (status = 'accepted' AND public.is_accepted_applicant_on_post(post_id))
  );
