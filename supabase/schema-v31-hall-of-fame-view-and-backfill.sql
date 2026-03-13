-- =============================================
-- 명예의 전당: 인증 점수 실시간 반영 + 프로필 점수 백필
-- Supabase SQL Editor 에서 실행하세요.
-- =============================================

-- 1. 명예의 전당용 뷰: challenge_certifications + challenges 에서 점수 합산
--    (profiles.challenge_points 미반영 이슈 방지, 항상 실제 인증 기준으로 랭킹)
CREATE OR REPLACE VIEW public.hall_of_fame_leaderboard AS
SELECT
  p.id,
  p.full_name,
  NULL::text AS username,
  p.avatar_url,
  p.travel_level,
  COALESCE(SUM(c.points), 0)::integer AS challenge_points,
  p.nationality
FROM public.profiles p
LEFT JOIN public.challenge_certifications cc ON cc.user_id = p.id
LEFT JOIN public.challenges c ON c.id = cc.challenge_id
GROUP BY p.id, p.full_name, p.avatar_url, p.travel_level, p.nationality
HAVING COALESCE(SUM(c.points), 0) > 0;

-- API에서 뷰 조회 허용
GRANT SELECT ON public.hall_of_fame_leaderboard TO anon;
GRANT SELECT ON public.hall_of_fame_leaderboard TO authenticated;

-- 2. 기존 인증 데이터로 profiles.challenge_points 일괄 동기화 (대시보드/프로필 등에서 사용)
UPDATE public.profiles
SET challenge_points = (
  SELECT COALESCE(SUM(c.points), 0)::integer
  FROM public.challenge_certifications cc
  JOIN public.challenges c ON c.id = cc.challenge_id
  WHERE cc.user_id = profiles.id
);
