-- ============================================================
-- v43: 메시지 배지 숫자를 실제 읽지 않은 메시지 수로 계산
-- (notifications 테이블이 아닌 messages + chat_participants.last_read_at 기준)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.messages m
  JOIN public.chat_participants cp ON cp.chat_id = m.chat_id AND cp.user_id = p_user_id
  WHERE m.sender_id != p_user_id
    AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz);
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_message_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(uuid) TO anon;
