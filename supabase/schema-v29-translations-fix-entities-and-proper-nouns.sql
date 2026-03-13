-- ============================================================
-- v29: 번역 데이터 보정 (HTML 엔티티 + 고유명사)
-- Supabase SQL Editor에서 실행하세요.
-- 1) &#39; 등 → 실제 따옴표로 치환
-- 2) 설명 문단에서 "번역된 제목"을 원문(title_en)으로 치환 (레스토랑/장소명 등)
-- ============================================================

-- 1. HTML 엔티티 치환 (title, description)
UPDATE public.challenge_translations
SET
  title = REPLACE(REPLACE(REPLACE(REPLACE(title, '&#39;', ''''), '&quot;', '"'), '&apos;', ''''), '&amp;', '&'),
  description = CASE
    WHEN description IS NULL THEN NULL
    ELSE REPLACE(REPLACE(REPLACE(REPLACE(description, '&#39;', ''''), '&quot;', '"'), '&apos;', ''''), '&amp;', '&')
  END
WHERE title LIKE '%&#39;%' OR title LIKE '%&quot;%' OR title LIKE '%&apos;%' OR title LIKE '%&amp;%'
   OR (description IS NOT NULL AND (description LIKE '%&#39;%' OR description LIKE '%&quot;%' OR description LIKE '%&apos;%' OR description LIKE '%&amp;%'));

-- 2. 고유명사 복원: 설명에서 "번역된 제목"을 원문(영문)으로 치환 (en 제외)
UPDATE public.challenge_translations t
SET description = REPLACE(t.description, t.title, c.title_en)
FROM public.challenges c
WHERE t.challenge_id = c.id
  AND t.lang <> 'en'
  AND t.description IS NOT NULL
  AND t.title IS DISTINCT FROM c.title_en;
