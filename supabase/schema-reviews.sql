-- =============================================
-- 후기(Review) 시스템
-- Supabase SQL Editor 에서 실행하세요
-- =============================================

-- 후기 테이블
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.companion_posts(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  tags TEXT[],  -- ['friendly', 'punctual', 'communicative', 'responsible', 'fun']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- 같은 여행(post)에서 같은 사람에게 한 번만 후기 작성 가능
  UNIQUE(reviewer_id, reviewee_id, post_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 후기는 누구나 볼 수 있음
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
-- 본인이 작성한 후기만 추가/삭제 가능
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- 후기 개수와 평균 별점을 profiles에 자동 업데이트하는 트리거
CREATE OR REPLACE FUNCTION public.update_profile_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
  v_avg DECIMAL(3,2);
BEGIN
  -- INSERT 또는 DELETE에 따라 대상 user_id 결정
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.reviewee_id;
  ELSE
    v_user_id := NEW.reviewee_id;
  END IF;

  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO v_count, v_avg
  FROM public.reviews
  WHERE reviewee_id = v_user_id;

  UPDATE public.profiles
  SET review_count = v_count,
      trust_score = v_avg
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_review_stats();

-- 후기 알림 트리거
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name TEXT;
BEGIN
  SELECT full_name INTO v_reviewer_name
  FROM public.profiles WHERE id = NEW.reviewer_id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (
    NEW.reviewee_id,
    'review',
    '⭐ New review received!',
    COALESCE(v_reviewer_name, 'Someone') || ' gave you ' || NEW.rating || ' stars' || CASE WHEN NEW.content IS NOT NULL THEN ': "' || LEFT(NEW.content, 50) || '"' ELSE '' END,
    NEW.reviewer_id,
    'user'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
CREATE TRIGGER on_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_review();
