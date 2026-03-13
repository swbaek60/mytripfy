-- =============================================
-- mytripfy 추가 테이블 (2차)
-- Supabase SQL Editor 에서 실행하세요
-- =============================================

-- 북마크 (즐겨찾기)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('companion_post', 'guide')) NOT NULL,
  reference_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type, reference_id)
);

-- 버킷리스트 (가고싶은 나라)
CREATE TABLE IF NOT EXISTS public.bucket_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

-- 알림
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 여행 성향
CREATE TABLE IF NOT EXISTS public.travel_personalities (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  personality_type TEXT NOT NULL,
  personality_desc TEXT,
  scores JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_personalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_all" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "bucket_list_all" ON public.bucket_list FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "personalities_select" ON public.travel_personalities FOR SELECT USING (true);
CREATE POLICY "personalities_all" ON public.travel_personalities FOR ALL USING (auth.uid() = id);

-- 알림 자동 생성 트리거 (동행 신청시)
CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner UUID;
  v_post_title TEXT;
  v_applicant_name TEXT;
BEGIN
  SELECT user_id, title INTO v_post_owner, v_post_title
  FROM public.companion_posts WHERE id = NEW.post_id;

  SELECT full_name INTO v_applicant_name
  FROM public.profiles WHERE id = NEW.applicant_id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (
    v_post_owner,
    'application',
    'New application received!',
    (COALESCE(v_applicant_name, 'Someone') || ' applied for your trip: ' || COALESCE(v_post_title, 'your trip')),
    NEW.post_id,
    'companion_post'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_companion_application ON public.companion_applications;
CREATE TRIGGER on_companion_application
  AFTER INSERT ON public.companion_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application();

-- 알림 자동 생성 트리거 (신청 수락/거절시)
CREATE OR REPLACE FUNCTION public.notify_on_application_update()
RETURNS TRIGGER AS $$
DECLARE
  v_post_title TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    SELECT title INTO v_post_title FROM public.companion_posts WHERE id = NEW.post_id;

    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.applicant_id,
      NEW.status,
      CASE WHEN NEW.status = 'accepted' THEN '🎉 Application Accepted!' ELSE 'Application Update' END,
      CASE WHEN NEW.status = 'accepted'
        THEN 'Your application for "' || COALESCE(v_post_title, 'the trip') || '" was accepted!'
        ELSE 'Your application for "' || COALESCE(v_post_title, 'the trip') || '" was not accepted this time.'
      END,
      NEW.post_id,
      'companion_post'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_status_change ON public.companion_applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.companion_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_update();

-- 가이드 지역 매칭 알림 트리거
-- 새로운 동행 모집글이 올라왔을 때, 해당 나라를 가이드 지역으로 등록한 가이드에게 알림
CREATE OR REPLACE FUNCTION public.notify_guides_on_new_post()
RETURNS TRIGGER AS $$
DECLARE
  v_guide RECORD;
  v_author_name TEXT;
BEGIN
  SELECT full_name INTO v_author_name FROM public.profiles WHERE id = NEW.user_id;

  FOR v_guide IN
    SELECT id FROM public.profiles
    WHERE is_guide = TRUE
    AND guide_regions @> ARRAY[NEW.destination_country]
    AND id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_guide.id,
      'guide_match',
      '🧭 New trip in your guide region!',
      'A traveler is looking for a guide in ' || NEW.destination_country || ': "' || NEW.title || '"',
      NEW.id,
      'companion_post'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_companion_post ON public.companion_posts;
CREATE TRIGGER on_new_companion_post
  AFTER INSERT ON public.companion_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_guides_on_new_post();

-- Supabase Storage: avatars 버킷 (아래 명령은 대시보드에서 수동으로 생성하세요)
-- Storage > New bucket > Name: "avatars" > Public bucket: ON
