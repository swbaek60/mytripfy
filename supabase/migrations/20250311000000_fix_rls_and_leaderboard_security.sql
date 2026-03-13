-- =============================================
-- Supabase Advisor 보안 이슈 해결
-- 1) RLS 활성화: chats, chat_participants, messages (정책은 이미 있음)
-- 2) 리더보드 뷰: SECURITY INVOKER 로 변경 (호출자 권한으로 실행)
-- =============================================

-- ─── 1. RLS 활성화 (Policy Exists RLS Disabled / RLS Disabled in Public) ───
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ─── 2. 리더보드 뷰를 SECURITY INVOKER 로 재정의 (Security Definer View 해소) ───

-- hall_of_fame_leaderboard
CREATE OR REPLACE VIEW public.hall_of_fame_leaderboard
WITH (security_invoker = true)
AS
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

-- contribution_leaderboard
CREATE OR REPLACE VIEW public.contribution_leaderboard
WITH (security_invoker = true)
AS
WITH
cp AS (
  SELECT user_id, COUNT(*) * 5 AS pts FROM public.companion_posts GROUP BY user_id
),
ca AS (
  SELECT applicant_id AS user_id, COUNT(*) * 10 AS pts
  FROM public.companion_applications WHERE status = 'accepted'
  GROUP BY applicant_id
),
ga AS (
  SELECT guide_id AS user_id, COUNT(*) * 15 AS pts
  FROM public.guide_applications WHERE status = 'accepted'
  GROUP BY guide_id
),
rv AS (
  SELECT reviewee_id AS user_id, COUNT(*) * 3 AS pts
  FROM public.reviews
  GROUP BY reviewee_id
)
SELECT
  p.id,
  p.full_name,
  NULL::text AS username,
  p.avatar_url,
  p.travel_level,
  (COALESCE(cp.pts, 0) + COALESCE(ca.pts, 0) + COALESCE(ga.pts, 0) + COALESCE(rv.pts, 0))::integer AS contribution_points,
  p.nationality
FROM public.profiles p
LEFT JOIN cp ON cp.user_id = p.id
LEFT JOIN ca ON ca.user_id = p.id
LEFT JOIN ga ON ga.user_id = p.id
LEFT JOIN rv ON rv.user_id = p.id
WHERE (COALESCE(cp.pts, 0) + COALESCE(ca.pts, 0) + COALESCE(ga.pts, 0) + COALESCE(rv.pts, 0)) > 0;

-- overall_leaderboard (hall_of_fame_leaderboard, contribution_leaderboard 에 의존)
CREATE OR REPLACE VIEW public.overall_leaderboard
WITH (security_invoker = true)
AS
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

-- 권한 유지
GRANT SELECT ON public.hall_of_fame_leaderboard TO anon;
GRANT SELECT ON public.hall_of_fame_leaderboard TO authenticated;
GRANT SELECT ON public.contribution_leaderboard TO anon;
GRANT SELECT ON public.contribution_leaderboard TO authenticated;
GRANT SELECT ON public.overall_leaderboard TO anon;
GRANT SELECT ON public.overall_leaderboard TO authenticated;
