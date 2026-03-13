-- ================================================================
-- schema-v12.sql  (2026-02-27)
-- 100 Countries: 9개 국가 포인트 20pt 로 상향
-- ================================================================
-- 적용 방법: Supabase Dashboard → SQL Editor → 이 파일 전체 붙여넣고 Run
-- ================================================================

UPDATE public.challenges
SET points = 20
WHERE category = 'countries'
  AND title_en IN (
    'Japan',
    'South Korea',
    'Vietnam',
    'Iceland',
    'Spain',
    'Switzerland',
    'United States',
    'China',
    'Russia'
  );

-- ================================================================
-- 완료: 9개 국가 10pt → 20pt (Iceland 는 15pt → 20pt)
-- Japan, South Korea, Vietnam, Iceland, Spain,
-- Switzerland, United States, China, Russia
-- ================================================================
