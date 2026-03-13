-- 본인 방문 인증만 삭제 가능 (인증 삭제 버튼용)
CREATE POLICY "sponsor_visits_delete" ON public.sponsor_visits
  FOR DELETE
  USING (auth.uid() = user_id);
