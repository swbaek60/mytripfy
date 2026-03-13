-- ============================================================
-- v27: Guide City Regions (국가 + 세부 도시/지역)
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. profiles 테이블에 guide_city_regions 컬럼 추가
--    JSONB 배열: [{country: 'JP', cities: ['Tokyo', 'Osaka']}, ...]
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guide_city_regions JSONB DEFAULT '[]'::jsonb;

-- 2. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_guide_city_regions
  ON public.profiles USING gin(guide_city_regions);

-- 3. 기존 guide_regions(TEXT[])을 guide_city_regions(JSONB)로 마이그레이션
--    이미 guide_city_regions가 있는 행은 건너뜀
UPDATE public.profiles
SET guide_city_regions = (
  SELECT jsonb_agg(jsonb_build_object('country', r, 'cities', '[]'::jsonb))
  FROM unnest(guide_regions) AS r
)
WHERE guide_regions IS NOT NULL
  AND array_length(guide_regions, 1) > 0
  AND (guide_city_regions IS NULL OR guide_city_regions = '[]'::jsonb);
