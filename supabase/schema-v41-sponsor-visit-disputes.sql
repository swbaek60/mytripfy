-- ============================================================
-- v41: 스폰서 방문 인증 딴지걸기 (신고)
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sponsor_visit_disputes (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id   uuid        NOT NULL REFERENCES public.sponsor_visits(id) ON DELETE CASCADE,
  reporter_id uuid       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason     text        NOT NULL CHECK (char_length(reason) >= 10),
  created_at timestamptz DEFAULT now(),
  UNIQUE (visit_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_visit_disputes_visit ON public.sponsor_visit_disputes(visit_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visit_disputes_reporter ON public.sponsor_visit_disputes(reporter_id);

ALTER TABLE public.sponsor_visit_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sponsor_visit_disputes_select" ON public.sponsor_visit_disputes;
CREATE POLICY "sponsor_visit_disputes_select" ON public.sponsor_visit_disputes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "sponsor_visit_disputes_insert" ON public.sponsor_visit_disputes;
CREATE POLICY "sponsor_visit_disputes_insert" ON public.sponsor_visit_disputes
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
