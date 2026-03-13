-- ===================================================
-- group_chat_id가 없는 기존 companion_posts에 그룹 채팅방 생성
-- (그룹 채팅 기능 추가 이전에 생성된 게시물용)
-- ===================================================

DO $$
DECLARE
  r RECORD;
  new_chat_id UUID;
BEGIN
  FOR r IN
    SELECT p.id, p.user_id, p.title
    FROM companion_posts p
    WHERE p.group_chat_id IS NULL
  LOOP
    -- 채팅방 생성
    INSERT INTO chats (type, is_group, name, reference_id, created_by)
    VALUES ('trip_group', true, r.title, r.id, r.user_id)
    RETURNING id INTO new_chat_id;

    -- 호스트 추가
    INSERT INTO chat_participants (chat_id, user_id)
    VALUES (new_chat_id, r.user_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;

    -- 수락된 신청자들 추가
    INSERT INTO chat_participants (chat_id, user_id)
    SELECT new_chat_id, applicant_id
    FROM companion_applications
    WHERE post_id = r.id AND status = 'accepted'
    ON CONFLICT (chat_id, user_id) DO NOTHING;

    -- 게시글에 연결
    UPDATE companion_posts SET group_chat_id = new_chat_id WHERE id = r.id;
  END LOOP;
END $$;
