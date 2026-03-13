-- ================================================================
-- mytripfy DB 정리 쿼리
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- ================================================================

-- ================================================================
-- [1] reviews 테이블 완전 재정비 (필수 실행)
-- ================================================================

DO $$
BEGIN

  -- 1-1. reviewed_id → reviewee_id 이름 변경
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reviewed_id'
  ) THEN
    ALTER TABLE public.reviews RENAME COLUMN reviewed_id TO reviewee_id;
    RAISE NOTICE '[reviews] reviewed_id → reviewee_id 변경 완료';
  ELSE
    RAISE NOTICE '[reviews] reviewee_id 이미 존재 (스킵)';
  END IF;

  -- 1-2. comment 컬럼 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'comment'
  ) THEN
    ALTER TABLE public.reviews DROP COLUMN comment;
    RAISE NOTICE '[reviews] comment 삭제 완료';
  ELSE
    RAISE NOTICE '[reviews] comment 없음 (스킵)';
  END IF;

  -- 1-3. review_type 컬럼 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'review_type'
  ) THEN
    ALTER TABLE public.reviews DROP COLUMN review_type;
    RAISE NOTICE '[reviews] review_type 삭제 완료';
  ELSE
    RAISE NOTICE '[reviews] review_type 없음 (스킵)';
  END IF;

  -- 1-4. reference_id 컬럼 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE public.reviews DROP COLUMN reference_id;
    RAISE NOTICE '[reviews] reference_id 삭제 완료';
  ELSE
    RAISE NOTICE '[reviews] reference_id 없음 (스킵)';
  END IF;

END $$;

-- 1-5. content 컬럼 추가 (없으면)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS content TEXT;

-- 1-6. post_id 컬럼 추가 (없으면)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.companion_posts(id) ON DELETE SET NULL;

-- 1-7. tags 컬럼 추가 (없으면)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 1-8. 기존 UNIQUE 제약 제거 후 재설정
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reference_id_key;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reviewee_id_post_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_reviewer_id_reviewee_id_post_id_key'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_reviewer_id_reviewee_id_post_id_key
      UNIQUE (reviewer_id, reviewee_id, post_id);
    RAISE NOTICE '[reviews] UNIQUE 제약 재설정 완료';
  END IF;
END $$;

-- 1-9. RLS 정책 재설정
DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;

CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);


-- ================================================================
-- [2] profiles 미사용 컬럼 제거
-- ================================================================

DO $$
BEGIN

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN username;
    RAISE NOTICE '[profiles] username 삭제 완료';
  ELSE
    RAISE NOTICE '[profiles] username 없음 (스킵)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'wechat_id'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN wechat_id;
    RAISE NOTICE '[profiles] wechat_id 삭제 완료';
  ELSE
    RAISE NOTICE '[profiles] wechat_id 없음 (스킵)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN website_url;
    RAISE NOTICE '[profiles] website_url 삭제 완료';
  ELSE
    RAISE NOTICE '[profiles] website_url 없음 (스킵)';
  END IF;

END $$;


-- ================================================================
-- [3] visited_countries 미사용 컬럼 제거
-- ================================================================

DO $$
BEGIN

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visited_countries' AND column_name = 'country_name'
  ) THEN
    ALTER TABLE public.visited_countries DROP COLUMN country_name;
    RAISE NOTICE '[visited_countries] country_name 삭제 완료';
  ELSE
    RAISE NOTICE '[visited_countries] country_name 없음 (스킵)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visited_countries' AND column_name = 'visited_year'
  ) THEN
    ALTER TABLE public.visited_countries DROP COLUMN visited_year;
    RAISE NOTICE '[visited_countries] visited_year 삭제 완료';
  ELSE
    RAISE NOTICE '[visited_countries] visited_year 없음 (스킵)';
  END IF;

END $$;


-- ================================================================
-- [4] companion_posts.cover_image 확인 추가
-- ================================================================

ALTER TABLE public.companion_posts ADD COLUMN IF NOT EXISTS cover_image TEXT;
