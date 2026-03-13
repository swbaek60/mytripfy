-- 방문 인증 삭제 시 해당 유저 포인트 차감 (본인 삭제 또는 매장 소유자 삭제 공통)
CREATE OR REPLACE FUNCTION public.sponsor_visit_delete_points()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'approved' AND OLD.points_granted > 0 THEN
    UPDATE public.profiles
    SET challenge_points = GREATEST(COALESCE(challenge_points, 0) - OLD.points_granted, 0)
    WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sponsor_visit_delete_points ON public.sponsor_visits;
CREATE TRIGGER on_sponsor_visit_delete_points
  AFTER DELETE ON public.sponsor_visits
  FOR EACH ROW EXECUTE FUNCTION public.sponsor_visit_delete_points();

-- 매장 소유자는 해당 스폰서의 모든 방문 인증 삭제 가능
CREATE POLICY "sponsor_visits_delete_by_owner" ON public.sponsor_visits
  FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM public.sponsors WHERE id = sponsor_id)
  );
