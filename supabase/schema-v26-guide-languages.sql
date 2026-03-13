-- ============================================================
-- v26: Guide Language Skills & Request Preferred Languages
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. profiles 테이블에 spoken_languages 컬럼 추가
--    JSONB 배열: [{lang: 'en', level: 'native'}, {lang: 'ko', level: 'fluent'}]
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS spoken_languages JSONB DEFAULT '[]'::jsonb;

-- 2. guide_requests 테이블에 preferred_languages 컬럼 추가
--    TEXT 배열: ['en', 'ko'] (언어 코드만, 어느 레벨이든 가능)
ALTER TABLE public.guide_requests
  ADD COLUMN IF NOT EXISTS preferred_languages TEXT[] DEFAULT '{}';

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_spoken_languages
  ON public.profiles USING gin(spoken_languages);

CREATE INDEX IF NOT EXISTS idx_guide_requests_preferred_languages
  ON public.guide_requests USING gin(preferred_languages);

-- 4. 트리거 함수 업데이트: 언어 조건도 매칭
CREATE OR REPLACE FUNCTION public.notify_guides_on_new_guide_request()
RETURNS TRIGGER AS $$
DECLARE
  v_guide RECORD;
  v_author_name TEXT;
  v_lang_match BOOLEAN;
BEGIN
  SELECT full_name INTO v_author_name FROM public.profiles WHERE id = NEW.user_id;

  FOR v_guide IN
    SELECT id, spoken_languages FROM public.profiles
    WHERE is_guide = TRUE
    AND guide_regions IS NOT NULL
    AND guide_regions @> ARRAY[NEW.destination_country]
    AND id != NEW.user_id
  LOOP
    -- 언어 조건 확인: preferred_languages가 비어있으면 무조건 알림
    -- 있으면 가이드의 spoken_languages와 교집합 확인
    v_lang_match := TRUE;

    IF NEW.preferred_languages IS NOT NULL AND array_length(NEW.preferred_languages, 1) > 0 THEN
      -- 가이드의 spoken_languages 중 하나라도 preferred_languages에 포함되면 매칭
      v_lang_match := EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(v_guide.spoken_languages, '[]'::jsonb)) AS elem
        WHERE (elem->>'lang') = ANY(NEW.preferred_languages)
      );
    END IF;

    IF v_lang_match THEN
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (
        v_guide.id,
        'guide_request_match',
        '🧭 New guide request matching your languages!',
        COALESCE(v_author_name, 'A traveler') || ' is looking for a guide in ' || NEW.destination_country || ': "' || NEW.title || '"',
        NEW.id,
        'guide_request'
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재등록 (함수가 변경되었으므로)
DROP TRIGGER IF EXISTS on_new_guide_request ON public.guide_requests;
CREATE TRIGGER on_new_guide_request
  AFTER INSERT ON public.guide_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_guides_on_new_guide_request();
