-- =============================================
-- 명예의 전당: 종합 랭킹 (경험 + 기여 합산)
-- hall_of_fame_leaderboard + contribution_leaderboard 뷰가 있어야 합니다.
-- Supabase SQL Editor 에서 실행하세요.
-- =============================================

CREATE OR REPLACE VIEW public.overall_leaderboard AS
SELECT
  COALESCE(e.id, c.id) AS id,
  COALESCE(e.full_name, c.full_name) AS full_name,
  COALESCE(e.username, c.username) AS username,
  COALESCE(e.avatar_url, c.avatar_url) AS avatar_url,
  COALESCE(e.travel_level, c.travel_level) AS travel_level,
  (COALESCE(e.challenge_points, 0) + COALESCE(c.contribution_points, 0))::integer AS total_points,
  COALESCE(e.challenge_points, 0)::integer AS challenge_points,
  COALESCE(c.contribution_points, 0)::integer AS contribution_points,
  COALESCE(e.nationality, c.nationality) AS nationality
FROM public.hall_of_fame_leaderboard e
FULL OUTER JOIN public.contribution_leaderboard c ON e.id = c.id
WHERE (COALESCE(e.challenge_points, 0) + COALESCE(c.contribution_points, 0)) > 0;

GRANT SELECT ON public.overall_leaderboard TO anon;
GRANT SELECT ON public.overall_leaderboard TO authenticated;
