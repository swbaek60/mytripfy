-- ================================================================
-- schema-v14.sql  (2026-02-27)
-- 100 Animals: 9개 추가 → 91개 → 100개
-- 기존 목록에 없는 대표 동물 선정 (Big Five 누락 1종, 최상위 포식자 등)
-- ================================================================
-- 적용 방법: Supabase Dashboard → SQL Editor → 전체 붙여넣고 Run
-- ================================================================

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES

-- ① 침팬지 — Jane Goodall 연구지, 도구 사용·사냥하는 유인원
('animals','침팬지','Chimpanzee','TZ',
 'Gombe Stream Jane Goodall legacy; tool use, hunting parties, 98.7% human DNA, politics',20),

-- ② 그레이트 화이트 샤크 — 세계 최고 포식 상어, 케이지 다이빙 성지
('animals','백상아리','Great White Shark','ZA',
 'Gansbaai cage diving; 6m apex predator, breaches 4m, electrical sense ampullae',15),

-- ③ 아프리카 물소 (케이프 버팔로) — 빅5 중 유일 미포함 종
('animals','아프리카 물소','Cape Buffalo','TZ',
 'Serengeti Big Five; 900kg unpredictable, kills more hunters than any African animal',10),

-- ④ 세발가락 나무늘보 — 세상에서 가장 느린 포유류
('animals','세발가락 나무늘보','Three-toed Sloth','CR',
 'Costa Rica cloud forest; sleeps 20hrs, algae-green fur camouflage, upside-down life',10),

-- ⑤ 퍼핀 — 아이슬란드 상징 바닷새, 날개로 물속 헤엄
('animals','대서양 퍼핀','Atlantic Puffin','IS',
 'Westman Islands Iceland; 60 million world population, dives 60m, beak 10 fish at once',10),

-- ⑥ 페넥 여우 — 사막 최소 여우, 초대형 귀 방열
('animals','페넥 여우','Fennec Fox','TN',
 'Sahara sand dunes; worlds smallest fox 1.5kg, ears 15cm radiate heat, night hunter',10),

-- ⑦ 아무르 호랑이 (시베리아 호랑이) — 가장 큰 고양잇과, 극한 냉기 생존
('animals','아무르 호랑이','Amur Tiger','RU',
 'Far East Russia Ussuri; largest cat 300kg, 500 remaining, -40C Siberian survival',20),

-- ⑧ 귀상어 — 갈라파고스 대규모 군집, 강렬한 수중 장관
('animals','귀상어','Scalloped Hammerhead Shark','EC',
 'Galápagos Darwin Island schools; 360° vision, electromagnetic prey detection, schooling hundreds',15),

-- ⑨ 황금들창코원숭이 — 중국 고유, 파란 얼굴·황금 털 희귀 원숭이
('animals','황금들창코원숭이','Golden Snub-nosed Monkey','CN',
 'Qinling-Sichuan forests; blue-faced, golden-orange fur, -20C mountain survival, China icon',15);

-- ================================================================
-- 완료: Animals 총 100개 (91 + 9)
-- 추가: 침팬지·백상아리·아프리카물소·세발가락나무늘보·퍼핀·
--        페넥여우·아무르호랑이·귀상어·황금들창코원숭이
-- ================================================================
