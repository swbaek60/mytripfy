-- ============================================================
-- v28: Challenge Translations (하이브리드 다국어)
-- Supabase SQL Editor에서 실행하세요.
--
-- • 기본 언어: en, ko(시드) + ja, zh, es, fr, de, pt, it(스크립트로 시드, npm run seed:translations).
-- • 나머지 locale은 en 폴백.
-- • 새 언어 추가: challenge_translations에 INSERT 하거나 seed 스크립트 확장.
-- ============================================================

-- 1. 번역 테이블: (challenge_id, lang) 당 title, description
CREATE TABLE IF NOT EXISTS public.challenge_translations (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (challenge_id, lang)
);

-- 2. 인덱스 (locale별 조회용)
CREATE INDEX IF NOT EXISTS idx_challenge_translations_lang
  ON public.challenge_translations(lang);

CREATE INDEX IF NOT EXISTS idx_challenge_translations_challenge_id
  ON public.challenge_translations(challenge_id);

-- 3. RLS: 모든 사용자 읽기 허용 (challenges와 동일)
ALTER TABLE public.challenge_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_translations_select" ON public.challenge_translations;
CREATE POLICY "challenge_translations_select" ON public.challenge_translations
  FOR SELECT USING (true);

-- 4. 기존 challenges에서 en, ko 시드 (한 번만 실행)
INSERT INTO public.challenge_translations (challenge_id, lang, title, description)
SELECT id, 'en', title_en, description_en
FROM public.challenges
ON CONFLICT (challenge_id, lang) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO public.challenge_translations (challenge_id, lang, title, description)
SELECT id, 'ko', title_ko, description_en
FROM public.challenges
ON CONFLICT (challenge_id, lang) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;
