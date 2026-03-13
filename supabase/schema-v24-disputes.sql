-- ============================================================
-- schema-v24-disputes.sql — 딴지걸기 (Community Dispute) System
-- ============================================================
-- Run in Supabase Dashboard → SQL Editor

-- ── 1. challenge_certifications 에 dispute 상태 컬럼 추가 ──────
ALTER TABLE public.challenge_certifications
  ADD COLUMN IF NOT EXISTS dispute_status text NOT NULL DEFAULT 'clean';

ALTER TABLE public.challenge_certifications
  DROP CONSTRAINT IF EXISTS cert_dispute_status_chk;
ALTER TABLE public.challenge_certifications
  ADD CONSTRAINT cert_dispute_status_chk
  CHECK (dispute_status IN ('clean', 'flagged', 'reviewing', 'invalidated'));

-- RLS (공개 피드용)
ALTER TABLE public.challenge_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certs_select_all" ON public.challenge_certifications;
CREATE POLICY "certs_select_all" ON public.challenge_certifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "certs_insert_own" ON public.challenge_certifications;
CREATE POLICY "certs_insert_own" ON public.challenge_certifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 2. 딴지(신고) 테이블 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.challenge_disputes (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  cert_user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cert_challenge_id uuid        NOT NULL,
  reporter_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason            text        NOT NULL CHECK (char_length(reason) >= 10),
  points_staked     int         NOT NULL DEFAULT 5,
  status            text        NOT NULL DEFAULT 'open'
                                  CHECK (status IN ('open','reviewing','upheld','dismissed')),
  created_at        timestamptz DEFAULT now(),
  resolved_at       timestamptz,
  UNIQUE (cert_user_id, cert_challenge_id, reporter_id)
);

ALTER TABLE public.challenge_disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "disputes_select_all" ON public.challenge_disputes;
CREATE POLICY "disputes_select_all" ON public.challenge_disputes FOR SELECT USING (true);
DROP POLICY IF EXISTS "disputes_insert_own" ON public.challenge_disputes;
CREATE POLICY "disputes_insert_own" ON public.challenge_disputes
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ── 3. 배심원 투표 테이블 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_votes (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  cert_user_id      uuid        NOT NULL,
  cert_challenge_id uuid        NOT NULL,
  voter_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote              text        NOT NULL CHECK (vote IN ('valid','invalid')),
  created_at        timestamptz DEFAULT now(),
  UNIQUE (cert_user_id, cert_challenge_id, voter_id)
);

ALTER TABLE public.dispute_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "votes_select_all" ON public.dispute_votes;
CREATE POLICY "votes_select_all" ON public.dispute_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "votes_insert_own" ON public.dispute_votes;
CREATE POLICY "votes_insert_own" ON public.dispute_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ── 4. 인증 신고 처리 함수 (SECURITY DEFINER) ─────────────────
-- 3명 이상 신고 시 → 'reviewing' 상태로 전환
CREATE OR REPLACE FUNCTION public.handle_new_dispute(
  p_cert_user_id    uuid,
  p_cert_challenge_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.challenge_disputes
  WHERE cert_user_id = p_cert_user_id
    AND cert_challenge_id = p_cert_challenge_id
    AND status IN ('open','reviewing');

  IF v_count >= 3 THEN
    UPDATE public.challenge_certifications
    SET dispute_status = 'reviewing'
    WHERE user_id = p_cert_user_id AND challenge_id = p_cert_challenge_id;

    UPDATE public.challenge_disputes
    SET status = 'reviewing'
    WHERE cert_user_id = p_cert_user_id
      AND cert_challenge_id = p_cert_challenge_id
      AND status = 'open';
  ELSIF v_count >= 1 THEN
    UPDATE public.challenge_certifications
    SET dispute_status = 'flagged'
    WHERE user_id = p_cert_user_id AND challenge_id = p_cert_challenge_id
      AND dispute_status = 'clean';
  END IF;
END;
$$;

-- ── 5. 배심원 투표 후 자동 결정 함수 ─────────────────────────
CREATE OR REPLACE FUNCTION public.resolve_cert_dispute(
  p_cert_user_id    uuid,
  p_cert_challenge_id uuid
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invalid int;
  v_valid   int;
  v_result  text := 'pending';
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE vote = 'invalid'),
    COUNT(*) FILTER (WHERE vote = 'valid')
  INTO v_invalid, v_valid
  FROM public.dispute_votes
  WHERE cert_user_id = p_cert_user_id
    AND cert_challenge_id = p_cert_challenge_id;

  -- 무효 3표 이상 → 인증 무효 처리
  IF v_invalid >= 3 THEN
    UPDATE public.challenge_certifications
    SET dispute_status = 'invalidated'
    WHERE user_id = p_cert_user_id AND challenge_id = p_cert_challenge_id;

    UPDATE public.challenge_disputes
    SET status = 'upheld', resolved_at = now()
    WHERE cert_user_id = p_cert_user_id AND cert_challenge_id = p_cert_challenge_id;

    v_result := 'invalidated';

  -- 유효 3표 이상 → 딴지 기각
  ELSIF v_valid >= 3 THEN
    UPDATE public.challenge_certifications
    SET dispute_status = 'clean'
    WHERE user_id = p_cert_user_id AND challenge_id = p_cert_challenge_id;

    UPDATE public.challenge_disputes
    SET status = 'dismissed', resolved_at = now()
    WHERE cert_user_id = p_cert_user_id AND cert_challenge_id = p_cert_challenge_id;

    v_result := 'dismissed';
  END IF;

  RETURN v_result;
END;
$$;
