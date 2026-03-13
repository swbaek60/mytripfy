
-- =============================================
-- 명예의 전당 옵션 A: 기여 랭킹 (경험 랭킹과 별도)
-- 동행·가이드·리뷰 활동으로 점수 집계
-- Supabase SQL Editor 에서 실행하세요.
-- =============================================
-- 점수: 동행 글 5pts/건, 동행 참여(수락) 10pts/건, 가이드 매칭(수락) 15pts/건, 받은 리뷰 3pts/건
-- 참고: reviews 컬럼이 reviewed_id 이면 rv 서브쿼리에서 reviewee_id → reviewed_id 로 바꿔 실행하세요.

CREATE OR REPLACE VIEW public.contribution_leaderboard AS
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

GRANT SELECT ON public.contribution_leaderboard TO anon;
GRANT SELECT ON public.contribution_leaderboard TO authenticated;

-- ----- 참고: reviews 테이블 컬럼명이 reviewed_id 인 경우 -----
-- 위 뷰 생성 시 "column reviewee_id does not exist" 오류가 나면
-- rv 서브쿼리만 아래처럼 바꾼 뒤 다시 실행하세요:
--   rv AS (
--     SELECT reviewed_id AS user_id, COUNT(*) * 3 AS pts
--     FROM public.reviews
--     GROUP BY reviewed_id
--   )
