-- ============================================================
-- v39: 명예의 전당 경험(검험) 랭킹에 스폰서 방문 인증 포인트 포함
-- 경험 = 챌린지 인증 점수 + 스폰서 매장 방문 인증 점수
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

CREATE OR REPLACE VIEW public.hall_of_fame_leaderboard AS
SELECT
  p.id,
  p.full_name,
  NULL::text AS username,
  p.avatar_url,
  p.travel_level,
  (
    COALESCE((
      SELECT SUM(c.points)::integer
      FROM public.challenge_certifications cc
      JOIN public.challenges c ON c.id = cc.challenge_id
      WHERE cc.user_id = p.id
    ), 0)
    + COALESCE((
      SELECT SUM(sv.points_granted)::integer
      FROM public.sponsor_visits sv
      WHERE sv.user_id = p.id AND sv.status = 'approved'
    ), 0)
  )::integer AS challenge_points,
  p.nationality
FROM public.profiles p
WHERE (
  COALESCE((
    SELECT SUM(c.points)
    FROM public.challenge_certifications cc
    JOIN public.challenges c ON c.id = cc.challenge_id
    WHERE cc.user_id = p.id
  ), 0)
  + COALESCE((
    SELECT SUM(sv.points_granted)
    FROM public.sponsor_visits sv
    WHERE sv.user_id = p.id AND sv.status = 'approved'
  ), 0)
) > 0;

GRANT SELECT ON public.hall_of_fame_leaderboard TO anon;
GRANT SELECT ON public.hall_of_fame_leaderboard TO authenticated;
