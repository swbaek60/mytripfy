-- =============================================
-- 그룹 채팅 알림 구분을 위한 트리거 업데이트
-- schema-group-chat.sql 실행 후 적용하세요
-- =============================================

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_participant RECORD;
  v_is_group    BOOLEAN;
  v_chat_name   TEXT;
BEGIN
  -- 보낸 사람 이름
  SELECT full_name INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;

  -- 채팅방이 그룹인지 확인
  SELECT is_group, name INTO v_is_group, v_chat_name
  FROM public.chats WHERE id = NEW.chat_id;

  FOR v_participant IN
    SELECT user_id FROM public.chat_participants
    WHERE chat_id = NEW.chat_id
    AND user_id != NEW.sender_id
  LOOP
    IF v_is_group THEN
      -- 그룹 채팅: reference_type='group_chat', reference_id=chat_id
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (
        v_participant.user_id,
        'message',
        '👥 ' || COALESCE(v_chat_name, 'Group Chat'),
        COALESCE(v_sender_name, 'Someone') || ': ' ||
          LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
        NEW.chat_id,
        'group_chat'
      );
    ELSE
      -- 1:1 채팅: reference_type='user', reference_id=sender_id (기존 방식)
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (
        v_participant.user_id,
        'message',
        '💬 New message',
        COALESCE(v_sender_name, 'Someone') || ': ' ||
          LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
        NEW.sender_id,
        'user'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재연결
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();
