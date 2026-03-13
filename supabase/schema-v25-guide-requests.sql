-- ============================================================
-- v25: Find Guides - "가이드 구해요" (guide_requests + guide_applications)
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. guide_requests: 여행자가 올리는 가이드 구인 요청
CREATE TABLE IF NOT EXISTS public.guide_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  destination_city TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. guide_applications: 가이드가 요청에 신청
CREATE TABLE IF NOT EXISTS public.guide_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.guide_requests(id) ON DELETE CASCADE NOT NULL,
  guide_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, guide_id)
);

-- 3. RLS
ALTER TABLE public.guide_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_applications ENABLE ROW LEVEL SECURITY;

-- guide_requests: 누구나 읽기, 작성자만 수정/삭제
CREATE POLICY "guide_requests_select" ON public.guide_requests FOR SELECT USING (true);
CREATE POLICY "guide_requests_insert" ON public.guide_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "guide_requests_update" ON public.guide_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "guide_requests_delete" ON public.guide_requests FOR DELETE USING (auth.uid() = user_id);

-- guide_applications: 요청 작성자 또는 신청한 가이드만 읽기
CREATE POLICY "guide_applications_select" ON public.guide_applications FOR SELECT
  USING (
    auth.uid() = guide_id
    OR auth.uid() IN (SELECT user_id FROM public.guide_requests WHERE id = request_id)
  );
CREATE POLICY "guide_applications_insert" ON public.guide_applications FOR INSERT WITH CHECK (auth.uid() = guide_id);
CREATE POLICY "guide_applications_update" ON public.guide_applications FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.guide_requests WHERE id = request_id));
CREATE POLICY "guide_applications_delete" ON public.guide_applications FOR DELETE
  USING (auth.uid() = guide_id);

-- 4. 트리거: 새 가이드 요청 등록 시 해당 지역 가이드에게 알림
CREATE OR REPLACE FUNCTION public.notify_guides_on_new_guide_request()
RETURNS TRIGGER AS $$
DECLARE
  v_guide RECORD;
  v_author_name TEXT;
BEGIN
  SELECT full_name INTO v_author_name FROM public.profiles WHERE id = NEW.user_id;

  FOR v_guide IN
    SELECT id FROM public.profiles
    WHERE is_guide = TRUE
    AND guide_regions IS NOT NULL
    AND guide_regions @> ARRAY[NEW.destination_country]
    AND id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_guide.id,
      'guide_request_match',
      '🧭 New guide request in your region!',
      COALESCE(v_author_name, 'A traveler') || ' is looking for a guide in ' || NEW.destination_country || ': "' || NEW.title || '"',
      NEW.id,
      'guide_request'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_guide_request ON public.guide_requests;
CREATE TRIGGER on_new_guide_request
  AFTER INSERT ON public.guide_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_guides_on_new_guide_request();

-- 5. 트리거: 가이드 신청 시 요청 작성자에게 알림
CREATE OR REPLACE FUNCTION public.notify_on_guide_application()
RETURNS TRIGGER AS $$
DECLARE
  v_request_owner UUID;
  v_request_title TEXT;
  v_guide_name TEXT;
BEGIN
  SELECT user_id, title INTO v_request_owner, v_request_title
  FROM public.guide_requests WHERE id = NEW.request_id;

  SELECT full_name INTO v_guide_name
  FROM public.profiles WHERE id = NEW.guide_id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (
    v_request_owner,
    'guide_application',
    '🧭 New guide application!',
    COALESCE(v_guide_name, 'A guide') || ' applied to your guide request: "' || COALESCE(v_request_title, 'your request') || '"',
    NEW.request_id,
    'guide_request'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_guide_application ON public.guide_applications;
CREATE TRIGGER on_guide_application
  AFTER INSERT ON public.guide_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_guide_application();

-- 6. 트리거: 가이드 신청 수락/거절 시 해당 가이드에게 알림
CREATE OR REPLACE FUNCTION public.notify_on_guide_application_update()
RETURNS TRIGGER AS $$
DECLARE
  v_request_title TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    SELECT title INTO v_request_title FROM public.guide_requests WHERE id = NEW.request_id;

    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.guide_id,
      NEW.status,
      CASE WHEN NEW.status = 'accepted' THEN '🎉 Guide application accepted!' ELSE 'Application update' END,
      CASE WHEN NEW.status = 'accepted'
        THEN 'Your application for "' || COALESCE(v_request_title, 'the guide request') || '" was accepted!'
        ELSE 'Your application for "' || COALESCE(v_request_title, 'the guide request') || '" was not accepted this time.'
      END,
      NEW.request_id,
      'guide_request'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_guide_application_status_change ON public.guide_applications;
CREATE TRIGGER on_guide_application_status_change
  AFTER UPDATE ON public.guide_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_guide_application_update();
