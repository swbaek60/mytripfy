-- Realtime이 메시지 INSERT를 브로드캐스트하려면 messages 테이블이
-- supabase_realtime publication에 포함되어 있어야 함 (이미 있으면 무시)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
