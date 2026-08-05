-- 번역 캐시에 제공자를 기록한다.
--
-- Google Translation API 가 실패하면 무료 MyMemory 로 폴백하는데, 품질 차이가 있다.
-- 어느 쪽으로 번역했는지 남겨 두면 Google 이 복구된 뒤 품질이 낮은 항목만 골라
-- 다시 번역할 수 있다. 기존 행은 모두 Google 로 만든 것이므로 기본값을 'google' 로 둔다.

ALTER TABLE public.ugc_translations
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'google';

-- 재번역 대상(폴백 결과)만 빠르게 찾기 위한 부분 인덱스.
CREATE INDEX IF NOT EXISTS idx_ugc_translations_fallback
  ON public.ugc_translations(created_at)
  WHERE provider <> 'google';
