-- ──────────────────────────────────────────────────────────────────────────────
-- schema-v36: 1:1 DM 채팅방 통합 (방안 A)
-- 동일한 두 사람 사이에 type='companion' / type='direct' 등 여러 채팅방이
-- 나뉘어 있는 경우, 가장 메시지가 많은(가장 최근 활동) 채팅방 하나로 통합합니다.
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  pair RECORD;
  keep_id   UUID;
  dup_id    UUID;
BEGIN
  -- 1:1 채팅방(is_group = false 또는 null)에서 동일 사용자 쌍이 여러 방을 가진 경우 찾기
  FOR pair IN
    WITH members AS (
      SELECT
        cp.chat_id,
        LEAST(cp.user_id, cp2.user_id)    AS user_a,
        GREATEST(cp.user_id, cp2.user_id) AS user_b
      FROM chat_participants cp
      JOIN chat_participants cp2
        ON cp.chat_id = cp2.chat_id AND cp.user_id <> cp2.user_id
      JOIN chats c ON c.id = cp.chat_id
      WHERE COALESCE(c.is_group, false) = false
    ),
    pairs_with_multiple AS (
      SELECT user_a, user_b
      FROM members
      GROUP BY user_a, user_b
      HAVING COUNT(DISTINCT chat_id) > 1
    )
    SELECT DISTINCT m.chat_id, p.user_a, p.user_b
    FROM members m
    JOIN pairs_with_multiple p USING (user_a, user_b)
  LOOP
    -- 해당 쌍의 모든 1:1 채팅방 중 "메시지가 가장 많은 방"을 대표 채팅방으로 선택
    SELECT c.id INTO keep_id
    FROM chats c
    JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = pair.user_a
    JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = pair.user_b
    WHERE COALESCE(c.is_group, false) = false
    ORDER BY (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) DESC,
             c.created_at ASC
    LIMIT 1;

    -- 나머지 중복 채팅방의 메시지를 대표 채팅방으로 이동
    FOR dup_id IN
      SELECT c.id
      FROM chats c
      JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = pair.user_a
      JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = pair.user_b
      WHERE COALESCE(c.is_group, false) = false
        AND c.id <> keep_id
    LOOP
      -- 메시지 이동
      UPDATE messages SET chat_id = keep_id WHERE chat_id = dup_id;
      -- 참가자 제거
      DELETE FROM chat_participants WHERE chat_id = dup_id;
      -- 채팅방 삭제
      DELETE FROM chats WHERE id = dup_id;
    END LOOP;
  END LOOP;
END $$;
