-- Performance: hot-path indexes + batched chat reads + hall-of-fame cert aggregation
-- Apply via Supabase SQL Editor or `supabase db push` / project migration pipeline.

-- ── Indexes (IF NOT EXISTS for idempotent apply) ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_chat_created_at_desc
  ON public.messages (chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id
  ON public.chat_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_companion_applications_post_id
  ON public.companion_applications (post_id);

CREATE INDEX IF NOT EXISTS idx_companion_questions_post_id
  ON public.companion_questions (post_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_type
  ON public.bookmarks (user_id, type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_visited_countries_user_id
  ON public.visited_countries (user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_certifications_user_id
  ON public.challenge_certifications (user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_certifications_challenge_id
  ON public.challenge_certifications (challenge_id);

-- ── Latest message per chat (service_role / admin client) ─────────────────
CREATE OR REPLACE FUNCTION public.latest_messages_for_chats(p_chat_ids uuid[])
RETURNS TABLE(chat_id uuid, content text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT ON (m.chat_id) m.chat_id, m.content, m.created_at
  FROM public.messages m
  WHERE m.chat_id = ANY(p_chat_ids)
  ORDER BY m.chat_id, m.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.chat_participant_counts(p_chat_ids uuid[])
RETURNS TABLE(chat_id uuid, member_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT cp.chat_id, COUNT(*)::bigint AS member_count
  FROM public.chat_participants cp
  WHERE cp.chat_id = ANY(p_chat_ids)
  GROUP BY cp.chat_id;
$$;

CREATE OR REPLACE FUNCTION public.direct_chat_peers(p_user_id uuid, p_chat_ids uuid[])
RETURNS TABLE(chat_id uuid, peer_id uuid, peer_full_name text, peer_avatar_url text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT ON (cp.chat_id)
    cp.chat_id,
    p.id AS peer_id,
    p.full_name AS peer_full_name,
    p.avatar_url AS peer_avatar_url
  FROM public.chat_participants cp
  JOIN public.profiles p ON p.id = cp.user_id
  WHERE cp.chat_id = ANY(p_chat_ids)
    AND cp.user_id <> p_user_id
  ORDER BY cp.chat_id, cp.joined_at NULLS LAST, p.id;
$$;

-- Hall of fame fallback: aggregate challenge points in DB (avoid full-table cert fetch)
CREATE OR REPLACE FUNCTION public.leaderboard_experience_from_certs(p_limit int DEFAULT 100)
RETURNS TABLE(user_id uuid, challenge_points bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT cc.user_id, SUM(c.points)::bigint AS challenge_points
    FROM public.challenge_certifications cc
    INNER JOIN public.challenges c ON c.id = cc.challenge_id
    GROUP BY cc.user_id
    HAVING SUM(c.points) > 0
  )
  SELECT user_id, challenge_points
  FROM agg
  ORDER BY challenge_points DESC
  LIMIT GREATEST(1, LEAST(p_limit, 500));
$$;

REVOKE ALL ON FUNCTION public.latest_messages_for_chats(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.latest_messages_for_chats(uuid[]) TO service_role;

REVOKE ALL ON FUNCTION public.chat_participant_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_participant_counts(uuid[]) TO service_role;

REVOKE ALL ON FUNCTION public.direct_chat_peers(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direct_chat_peers(uuid, uuid[]) TO service_role;

REVOKE ALL ON FUNCTION public.leaderboard_experience_from_certs(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leaderboard_experience_from_certs(int) TO anon, authenticated, service_role;

-- 헤더 배지: service_role(admin)에서 RPC 호출 허용
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(uuid) TO service_role;
