-- 동행찾기 Q&A 알림: notifications INSERT가 RLS로 클라이언트 차단되어 있으므로
-- DB 트리거로 호스트(질문 시) / 질문자(답변 시)에게 알림 생성

CREATE OR REPLACE FUNCTION public.notify_on_new_question()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner UUID;
  v_post_title TEXT;
  v_questioner_name TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT user_id, title INTO v_post_owner, v_post_title
  FROM public.companion_posts WHERE id = NEW.post_id;

  -- 자기 글에 질문한 경우는 알림 안 보냄
  IF v_post_owner IS NOT NULL AND v_post_owner IS DISTINCT FROM NEW.question_user_id THEN
    SELECT full_name INTO v_questioner_name
    FROM public.profiles WHERE id = NEW.question_user_id;

    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_post_owner,
      'question',
      'New question on your trip',
      COALESCE(v_questioner_name, 'Someone') || ' asked: ' || LEFT(NEW.question_content, 60) || CASE WHEN LENGTH(NEW.question_content) > 60 THEN '...' ELSE '' END,
      NEW.post_id,
      'companion_post'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_question ON public.companion_questions;
CREATE TRIGGER on_new_question
  AFTER INSERT ON public.companion_questions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_question();


CREATE OR REPLACE FUNCTION public.notify_on_new_answer()
RETURNS TRIGGER AS $$
DECLARE
  v_post_title TEXT;
  v_host_name TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  -- 답변이 새로 등록된 경우만 처리
  IF OLD.answer_content IS NULL AND NEW.answer_content IS NOT NULL AND NEW.question_user_id IS NOT NULL THEN
    SELECT title INTO v_post_title FROM public.companion_posts WHERE id = NEW.post_id;
    SELECT full_name INTO v_host_name FROM public.profiles WHERE id = NEW.answer_user_id;
    -- 질문자에게만 알림 (호스트 자신이면 제외)
    IF NEW.question_user_id IS DISTINCT FROM NEW.answer_user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (
        NEW.question_user_id,
        'answer',
        'Your question was answered',
        COALESCE(v_host_name, 'Host') || ' answered about "' || COALESCE(v_post_title, 'the trip') || '": ' || LEFT(NEW.answer_content, 60) || CASE WHEN LENGTH(NEW.answer_content) > 60 THEN '...' ELSE '' END,
        NEW.post_id,
        'companion_post'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_answer ON public.companion_questions;
CREATE TRIGGER on_new_answer
  AFTER UPDATE ON public.companion_questions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_answer();
