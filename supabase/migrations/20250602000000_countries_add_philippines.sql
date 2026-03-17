-- 100 Countries 챌린지에 필리핀(Philippines) 추가
INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points)
SELECT
  'countries',
  '필리핀',
  'Philippines',
  'PH',
  'The Philippines offers 7,000 islands: Palawan, Boracay, Cebu, and Manila. Spanish colonial heritage, Banaue rice terraces, and world-class diving. Selected for our World 100 as Southeast Asia''s most island-rich and welcoming destination.',
  10
WHERE NOT EXISTS (
  SELECT 1 FROM public.challenges WHERE category = 'countries' AND title_en = 'Philippines'
);

-- 긴 설명(선택): schema-v19 스타일로 이미지/메타용
UPDATE public.challenges
SET description_en = 'The Philippines is 7,000 islands: Palawan''s limestone lagoons, Boracay sunsets, Cebu diving, and Manila''s mix of colonial and modern. Spanish heritage, Banaue rice terraces, and Tubbataha Reef define a nation of warmth and variety. Selected for our World 100 as Southeast Asia''s most island-rich and welcoming destination.'
WHERE category = 'countries' AND title_en = 'Philippines';
