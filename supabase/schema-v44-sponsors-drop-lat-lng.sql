-- ============================================================
-- v44: sponsors 테이블에서 lat, lng 컬럼 제거 (위도/경도 미사용)
-- 매장 등록·상세는 주소(address)만 사용하고 지도 링크는 주소 검색으로 연결
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

ALTER TABLE public.sponsors
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lng;
