-- ============================================================
-- v22: reviews 테이블 수정/삭제 RLS 정책 추가
-- 작성자 본인만 수정/삭제 가능
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 리뷰 수정: 작성자 본인만
DROP POLICY IF EXISTS "reviews_update" ON public.reviews;
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- 리뷰 삭제: 작성자 본인만
DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE
  USING (auth.uid() = reviewer_id);
