-- companion_posts 테이블에 커버 이미지 컬럼 추가
ALTER TABLE public.companion_posts
  ADD COLUMN IF NOT EXISTS cover_image text;
