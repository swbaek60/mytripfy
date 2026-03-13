-- ============================================================
-- v38: sponsors 테이블에 전화번호(phone) 컬럼 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.sponsors.phone IS '매장/업체 연락처 전화번호';
