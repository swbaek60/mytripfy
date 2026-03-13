-- =============================================
-- Supabase Advisor 경고 해결
-- 1) Function Search Path Mutable: 18개 함수에 search_path 고정
-- 2) RLS Policy Always True: exchange_rates, messages, notifications 정책 정리
-- 3) Leaked Password Protection: 코드로 해결 불가. Supabase 대시보드 →
--    Authentication → Settings → "Leaked password protection" (HaveIBeenPwned) 활성화
-- =============================================

-- ─── 1. 함수 search_path 고정 (역할에 따른 search_path 변경 방지) ───

ALTER FUNCTION public.update_challenge_points() SET search_path = public;
ALTER FUNCTION public.update_trust_score() SET search_path = public;
ALTER FUNCTION public.notify_guides_on_new_guide_request() SET search_path = public;
ALTER FUNCTION public.notify_on_guide_application() SET search_path = public;
ALTER FUNCTION public.notify_on_guide_application_update() SET search_path = public;
ALTER FUNCTION public.notify_on_new_message() SET search_path = public;
ALTER FUNCTION public.notify_on_application_update() SET search_path = public;
ALTER FUNCTION public.notify_guides_on_new_post() SET search_path = public;
ALTER FUNCTION public.update_profile_review_stats() SET search_path = public;
ALTER FUNCTION public.notify_on_new_review() SET search_path = public;
ALTER FUNCTION public.handle_new_dispute(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_travel_level() SET search_path = public;
ALTER FUNCTION public.notify_on_application() SET search_path = public;
ALTER FUNCTION public.set_trips_updated_at() SET search_path = public;
ALTER FUNCTION public.sync_challenges_count() SET search_path = public;
ALTER FUNCTION public.resolve_cert_dispute(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.sponsor_visit_approve_points() SET search_path = public;
ALTER FUNCTION public.sponsors_updated_at() SET search_path = public;
ALTER FUNCTION public.sponsor_benefits_updated_at() SET search_path = public;

-- ─── 2. RLS 정책 정리 (Always True 경고 해소) ───

-- exchange_rates: "Allow manage exchange rates for ALL" 제거 (대시보드에서 추가된 경우 대비)
-- 읽기 전용만 허용하고, 수정은 서비스 역할만 하도록 정책 제한
DROP POLICY IF EXISTS "Allow manage exchange rates for ALL" ON public.exchange_rates;
-- 이미 "Anyone can read exchange rates" (SELECT USING true) 만 있으면 됨

-- messages: 과도하게 열린 INSERT 정책 제거 (이미 messages_insert 로 참여자+발신자 제한 있음)
DROP POLICY IF EXISTS "messages_insert_any_authenticated" ON public.messages;

-- notifications: 트리거가 타인에게 알림을 넣을 수 있도록, 트리거 함수 내에서 RLS를 잠시 끄고
-- INSERT 후 정책은 WITH CHECK (false) 로 두어 일반 클라이언트 직접 INSERT 차단.
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (false);

-- 알림을 넣는 트리거 함수들: RLS 우회 후 INSERT (동일 로직, 맨 앞에 set_config 추가)
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_participant RECORD;
  v_is_group    BOOLEAN;
  v_chat_name   TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  SELECT is_group, name INTO v_is_group, v_chat_name FROM public.chats WHERE id = NEW.chat_id;
  FOR v_participant IN
    SELECT user_id FROM public.chat_participants WHERE chat_id = NEW.chat_id AND user_id != NEW.sender_id
  LOOP
    IF v_is_group THEN
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (v_participant.user_id, 'message', '👥 ' || COALESCE(v_chat_name, 'Group Chat'),
        COALESCE(v_sender_name, 'Someone') || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
        NEW.chat_id, 'group_chat');
    ELSE
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (v_participant.user_id, 'message', '💬 New message',
        COALESCE(v_sender_name, 'Someone') || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
        NEW.sender_id, 'user');
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER AS $$
DECLARE v_post_owner UUID; v_post_title TEXT; v_applicant_name TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT user_id, title INTO v_post_owner, v_post_title FROM public.companion_posts WHERE id = NEW.post_id;
  SELECT full_name INTO v_applicant_name FROM public.profiles WHERE id = NEW.applicant_id;
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (v_post_owner, 'application', 'New application received!',
    (COALESCE(v_applicant_name, 'Someone') || ' applied for your trip: ' || COALESCE(v_post_title, 'your trip')),
    NEW.post_id, 'companion_post');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_on_application_update()
RETURNS TRIGGER AS $$
DECLARE v_post_title TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    SELECT title INTO v_post_title FROM public.companion_posts WHERE id = NEW.post_id;
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (NEW.applicant_id, NEW.status,
      CASE WHEN NEW.status = 'accepted' THEN '🎉 Application Accepted!' ELSE 'Application Update' END,
      CASE WHEN NEW.status = 'accepted' THEN 'Your application for "' || COALESCE(v_post_title, 'the trip') || '" was accepted!'
        ELSE 'Your application for "' || COALESCE(v_post_title, 'the trip') || '" was not accepted this time.' END,
      NEW.post_id, 'companion_post');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_guides_on_new_post()
RETURNS TRIGGER AS $$
DECLARE v_guide RECORD; v_author_name TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT full_name INTO v_author_name FROM public.profiles WHERE id = NEW.user_id;
  FOR v_guide IN SELECT id FROM public.profiles WHERE is_guide = TRUE AND guide_regions @> ARRAY[NEW.destination_country] AND id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (v_guide.id, 'guide_match', '🧭 New trip in your guide region!',
      'A traveler is looking for a guide in ' || NEW.destination_country || ': "' || NEW.title || '"', NEW.id, 'companion_post');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER AS $$
DECLARE v_reviewer_name TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT full_name INTO v_reviewer_name FROM public.profiles WHERE id = NEW.reviewer_id;
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (NEW.reviewee_id, 'review', '⭐ New review received!',
    COALESCE(v_reviewer_name, 'Someone') || ' gave you ' || NEW.rating || ' stars' || CASE WHEN NEW.content IS NOT NULL THEN ': "' || LEFT(NEW.content, 50) || '"' ELSE '' END,
    NEW.reviewer_id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_guides_on_new_guide_request()
RETURNS TRIGGER AS $$
DECLARE v_guide RECORD; v_author_name TEXT; v_lang_match BOOLEAN;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT full_name INTO v_author_name FROM public.profiles WHERE id = NEW.user_id;
  FOR v_guide IN SELECT id, spoken_languages FROM public.profiles
    WHERE is_guide = TRUE AND guide_regions IS NOT NULL AND guide_regions @> ARRAY[NEW.destination_country] AND id != NEW.user_id
  LOOP
    v_lang_match := TRUE;
    IF NEW.preferred_languages IS NOT NULL AND array_length(NEW.preferred_languages, 1) > 0 THEN
      v_lang_match := EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(v_guide.spoken_languages, '[]'::jsonb)) AS elem WHERE (elem->>'lang') = ANY(NEW.preferred_languages));
    END IF;
    IF v_lang_match THEN
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (v_guide.id, 'guide_request_match', '🧭 New guide request matching your languages!',
        COALESCE(v_author_name, 'A traveler') || ' is looking for a guide in ' || NEW.destination_country || ': "' || NEW.title || '"', NEW.id, 'guide_request');
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_on_guide_application()
RETURNS TRIGGER AS $$
DECLARE v_request_owner UUID; v_request_title TEXT; v_guide_name TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT user_id, title INTO v_request_owner, v_request_title FROM public.guide_requests WHERE id = NEW.request_id;
  SELECT full_name INTO v_guide_name FROM public.profiles WHERE id = NEW.guide_id;
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (v_request_owner, 'guide_application', '🧭 New guide application!',
    COALESCE(v_guide_name, 'A guide') || ' applied to your guide request: "' || COALESCE(v_request_title, 'your request') || '"', NEW.request_id, 'guide_request');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_on_guide_application_update()
RETURNS TRIGGER AS $$
DECLARE v_request_title TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    SELECT title INTO v_request_title FROM public.guide_requests WHERE id = NEW.request_id;
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (NEW.guide_id, NEW.status,
      CASE WHEN NEW.status = 'accepted' THEN '🎉 Guide application accepted!' ELSE 'Application update' END,
      CASE WHEN NEW.status = 'accepted' THEN 'Your application for "' || COALESCE(v_request_title, 'the guide request') || '" was accepted!'
        ELSE 'Your application for "' || COALESCE(v_request_title, 'the guide request') || '" was not accepted this time.' END,
      NEW.request_id, 'guide_request');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
