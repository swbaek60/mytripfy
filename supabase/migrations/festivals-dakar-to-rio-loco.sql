-- Festivals: Dakar Rally 중복 제거, Rio Loco Festival 추가
-- 1) 중복 행 삭제 (title_ko로 구분: 남기는 건 '다카르 랠리', 삭제하는 건 '탈라이만 사막 주행')
DELETE FROM public.challenges
WHERE category = 'festivals'
  AND title_en = 'Dakar Rally'
  AND title_ko = '탈라이만 사막 주행';

-- 2) Rio Loco Festival 추가
INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points)
VALUES (
  'festivals',
  '리오 프레타 쿠두로',
  'Rio Loco Festival',
  'FR',
  'Toulouse world music; 5 days June, 200,000, free stages Garonne riverside',
  10
);
