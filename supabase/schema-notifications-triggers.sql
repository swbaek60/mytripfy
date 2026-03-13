-- =============================================
-- 추가 알림 트리거
-- schema-v2.sql 이후에 실행하세요
--
-- ※ Q&A 알림(질문/답변)은 QuestionsSection.tsx 클라이언트 코드에서 직접 처리합니다.
--   아래 섹션 2, 3은 DB 트리거 방식이므로 코드와 이중 발송 방지를 위해 실행하지 마세요.
--   메시지 알림(섹션 1)만 실행하면 됩니다.
-- =============================================

-- 1. 메시지 알림: 메시지를 받으면 수신자에게 알림
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_participant RECORD;
BEGIN
  -- 보낸 사람 이름 가져오기
  SELECT full_name INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;

  -- 같은 채팅방 참여자들 중 보낸 사람 제외한 사람에게 알림
  FOR v_participant IN
    SELECT user_id FROM public.chat_participants
    WHERE chat_id = NEW.chat_id
    AND user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_participant.user_id,
      'message',
      '💬 New message',
      COALESCE(v_sender_name, 'Someone') || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
      NEW.sender_id,
      'user'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();


-- =================================================================
-- 아래 섹션 2, 3은 QuestionsSection.tsx 에서 클라이언트로 처리하므로
-- 실행하지 마세요 (이중 알림 방지)
-- =================================================================

-- 2. Q&A 질문 알림 (DB 트리거 방식 - 사용 안 함)
/*
CREATE OR REPLACE FUNCTION public.notify_on_new_question()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner UUID;
  v_post_title TEXT;
  v_questioner_name TEXT;
BEGIN
  SELECT user_id, title INTO v_post_owner, v_post_title
  FROM public.companion_posts WHERE id = NEW.post_id;

  SELECT full_name INTO v_questioner_name
  FROM public.profiles WHERE id = NEW.question_user_id;

  -- 자기 글에 질문한 경우는 알림 안 보냄
  IF v_post_owner IS DISTINCT FROM NEW.question_user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_post_owner,
      'question',
      '❓ New question on your trip',
      COALESCE(v_questioner_name, 'Someone') || ' asked: ' || LEFT(NEW.question_content, 60) || CASE WHEN LENGTH(NEW.question_content) > 60 THEN '...' ELSE '' END,
      NEW.post_id,
      'companion_post'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_question ON public.companion_questions;
CREATE TRIGGER on_new_question
  AFTER INSERT ON public.companion_questions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_question();
*/

-- 3. Q&A 답변 알림 (DB 트리거 방식 - 사용 안 함)
/*
CREATE OR REPLACE FUNCTION public.notify_on_new_answer()
RETURNS TRIGGER AS $$
DECLARE
  v_post_title TEXT;
  v_host_name TEXT;
BEGIN
  -- 답변이 새로 등록된 경우만 처리 (answer_content가 NULL→값 으로 바뀔 때)
  IF OLD.answer_content IS NULL AND NEW.answer_content IS NOT NULL THEN
    SELECT title INTO v_post_title
    FROM public.companion_posts WHERE id = NEW.post_id;

    SELECT full_name INTO v_host_name
    FROM public.profiles WHERE id = NEW.answer_user_id;

    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.question_user_id,
      'answer',
      '✅ Your question was answered!',
      'Host ' || COALESCE(v_host_name, '') || ' answered: ' || LEFT(NEW.answer_content, 60) || CASE WHEN LENGTH(NEW.answer_content) > 60 THEN '...' ELSE '' END,
      NEW.post_id,
      'companion_post'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_answer ON public.companion_questions;
CREATE TRIGGER on_new_answer
  AFTER UPDATE ON public.companion_questions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_answer();
*/
