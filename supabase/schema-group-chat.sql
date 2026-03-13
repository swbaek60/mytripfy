-- ===================================================
-- 그룹 채팅 지원을 위한 스키마 업데이트
-- ===================================================

-- 1. chats 테이블에 그룹 채팅 컬럼 추가
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS is_group   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS name       TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- type 제약 업데이트 (trip_group 추가)
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_type_check;
ALTER TABLE public.chats
  ADD CONSTRAINT chats_type_check
  CHECK (type IN ('companion', 'guide', 'direct', 'trip_group'));

-- 2. companion_posts에 그룹 채팅방 연결
ALTER TABLE public.companion_posts
  ADD COLUMN IF NOT EXISTS group_chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL;

-- 3. chat_participants에 마지막 읽은 시각 추가 (읽지않은 메시지 카운트용)
ALTER TABLE public.chat_participants
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- 4. RLS 정책 업데이트
-- 그룹 채팅은 참여자만 읽기 가능 (기존 정책과 동일하게 동작)
DROP POLICY IF EXISTS "chat participants can view chats" ON public.chats;
CREATE POLICY "chat participants can view chats"
  ON public.chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "authenticated users can create chats" ON public.chats;
CREATE POLICY "authenticated users can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "chat creator can update chats" ON public.chats;
CREATE POLICY "chat creator can update chats"
  ON public.chats FOR UPDATE
  USING (created_by = auth.uid() OR auth.role() = 'authenticated');

-- chat_participants: 참여자 추가는 인증된 사용자
DROP POLICY IF EXISTS "participants can view their chats" ON public.chat_participants;
CREATE POLICY "participants can view their chats"
  ON public.chat_participants FOR SELECT
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_participants cp2
      WHERE cp2.chat_id = chat_id AND cp2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "authenticated can join chats" ON public.chat_participants;
CREATE POLICY "authenticated can join chats"
  ON public.chat_participants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "participants can leave chats" ON public.chat_participants;
CREATE POLICY "participants can leave chats"
  ON public.chat_participants FOR DELETE
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE id = chat_id AND created_by = auth.uid()
    )
  );

-- last_read_at 업데이트 허용
DROP POLICY IF EXISTS "participants can update last_read" ON public.chat_participants;
CREATE POLICY "participants can update last_read"
  ON public.chat_participants FOR UPDATE
  USING (user_id = auth.uid());
