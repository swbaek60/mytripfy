-- 승인된 방문 인증은 누구나 읽기 가능 (스폰서 상세의 "방문 인증 목록"용)
CREATE POLICY "sponsor_visits_select_approved_public" ON public.sponsor_visits
  FOR SELECT
  USING (status = 'approved');
