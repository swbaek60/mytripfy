-- ============================================================
-- v30: Challenge Wishes ("가고 싶음" 버킷리스트)
-- Supabase SQL Editor에서 실행하세요.
--
-- • 챌린지별 "가고 싶음" 표시. 프로필 방문 국가에는 인증한 국가 + 가고 싶은 국가 표시.
-- • 기존 bucket_list 탭 제거 후 이 테이블로 통합.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.challenge_wishes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_wishes_user_id
  ON public.challenge_wishes(user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_wishes_challenge_id
  ON public.challenge_wishes(challenge_id);

ALTER TABLE public.challenge_wishes ENABLE ROW LEVEL SECURITY;

-- 프로필에서 타인도 "가고 싶은 국가"를 볼 수 있도록 SELECT는 전체 허용
DROP POLICY IF EXISTS "challenge_wishes_select" ON public.challenge_wishes;
CREATE POLICY "challenge_wishes_select" ON public.challenge_wishes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "challenge_wishes_insert_own" ON public.challenge_wishes;
CREATE POLICY "challenge_wishes_insert_own" ON public.challenge_wishes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_wishes_delete_own" ON public.challenge_wishes;
CREATE POLICY "challenge_wishes_delete_own" ON public.challenge_wishes
  FOR DELETE USING (auth.uid() = user_id);
