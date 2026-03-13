-- Museums: Larco Museum, Lima 중복 제거 (리마 라르코 박물관 1건 삭제), Acropolis Museum 추가
-- 1) 중복 행 삭제 (title_ko로 구분: '리마 라르코 박물관' 삭제, '페루 라르코 박물관' 유지)
DELETE FROM public.challenges
WHERE category = 'museums'
  AND title_en = 'Larco Museum, Lima'
  AND title_ko = '리마 라르코 박물관';

-- 2) Acropolis Museum, Athens 추가
INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points)
VALUES (
  'museums',
  '아테네 아크로폴리스 박물관',
  'Acropolis Museum, Athens',
  'GR',
  'Parthenon marbles context; glass floor over ancient ruins, Athens Greece',
  10
);
