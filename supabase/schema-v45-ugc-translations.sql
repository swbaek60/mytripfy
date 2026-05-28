-- ============================================================
-- v45: UGC Translation Cache
-- Google Translate API 결과 캐시 (동행/가이드/리뷰 등 사용자 생성 콘텐츠)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ugc_translations (
  source_hash TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (source_hash, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_ugc_translations_target_lang
  ON public.ugc_translations(target_lang);

ALTER TABLE public.ugc_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ugc_translations_select" ON public.ugc_translations;
CREATE POLICY "ugc_translations_select" ON public.ugc_translations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ugc_translations_service_all" ON public.ugc_translations;
CREATE POLICY "ugc_translations_service_all" ON public.ugc_translations
  FOR ALL USING (auth.role() = 'service_role');
