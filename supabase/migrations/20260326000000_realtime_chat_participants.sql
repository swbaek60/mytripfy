-- chat_participants 테이블을 Realtime publication에 추가 (읽음 표시용)
-- last_read_at 컬럼 변경을 실시간으로 구독하기 위해 필요
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename = 'chat_participants'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
  END IF;
END $$;
