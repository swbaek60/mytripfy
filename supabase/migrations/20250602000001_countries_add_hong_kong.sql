-- 100 Countries 챌린지에 홍콩(Hong Kong) 추가
INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points)
SELECT
  'countries',
  '홍콩',
  'Hong Kong',
  'HK',
  'Hong Kong blends skyscrapers and street food, Victoria Peak and Star Ferry, Cantonese dim sum and neon-lit nightlife. A former British colony and now a special administrative region, it offers world-class dining, hiking, and harbour views. Selected for our World 100 as Asia''s most dynamic city and gateway.',
  10
WHERE NOT EXISTS (
  SELECT 1 FROM public.challenges WHERE category = 'countries' AND title_en = 'Hong Kong'
);
