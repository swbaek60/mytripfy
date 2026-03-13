-- =============================================
-- mytripfy 프로필 사진 기능 추가 (schema-v4)
-- Supabase SQL Editor 에서 실행하세요
-- =============================================

-- profiles 테이블에 프로필 사진 배열 컬럼 추가 (최대 5장)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photos TEXT[] DEFAULT '{}';

-- Storage 버킷 photos에 대한 RLS 정책 안내
-- Supabase 대시보드 > Storage > 'photos' 버킷 생성 필요 (Public)
