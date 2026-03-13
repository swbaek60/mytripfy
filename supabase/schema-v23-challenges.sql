-- ============================================================
-- v23: Bucket List 100 Challenges
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 챌린지 완료 기록 테이블
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id INTEGER NOT NULL,           -- 챌린지 번호 (1~100)
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,                               -- 완료 메모 (선택)
  photo_url TEXT,                          -- 인증 사진 (선택)
  country_code TEXT,                       -- 완료한 국가
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- 누구나 볼 수 있음 (공개 프로필)
CREATE POLICY "user_challenges_select" ON public.user_challenges
  FOR SELECT USING (true);

-- 본인만 추가/수정/삭제
CREATE POLICY "user_challenges_insert" ON public.user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_challenges_update" ON public.user_challenges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_challenges_delete" ON public.user_challenges
  FOR DELETE USING (auth.uid() = user_id);

-- profiles 테이블에 챌린지 완료 수 컬럼 추가 (캐시용)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS challenges_completed INTEGER DEFAULT 0;

-- 챌린지 완료/취소 시 profiles.challenges_completed 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.sync_challenges_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
      SET challenges_completed = (
        SELECT COUNT(*) FROM public.user_challenges WHERE user_id = NEW.user_id
      )
      WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
      SET challenges_completed = (
        SELECT COUNT(*) FROM public.user_challenges WHERE user_id = OLD.user_id
      )
      WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_challenge_change ON public.user_challenges;
CREATE TRIGGER on_challenge_change
  AFTER INSERT OR DELETE ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.sync_challenges_count();
