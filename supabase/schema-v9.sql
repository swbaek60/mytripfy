-- ================================================================
-- schema-v9.sql  (2026-02-27)
-- 폐업·중복·오류 항목 정리 및 검증된 운영중인 장소로 교체
-- ================================================================
-- 적용 방법: Supabase Dashboard → SQL Editor → 이 파일 전체 붙여넣고 Run
-- ================================================================


-- ================================================================
-- [1] RESTAURANTS — 폐업 / 중복 / 오류 9개 삭제
-- ================================================================
DELETE FROM public.challenges
WHERE category = 'restaurants'
AND title_en IN (
  'El Bulli (Closed Legend)',      -- 2011년 7월 완전 폐업; 현재 elBulli Foundation 박물관
  'elBulli 1846 Cala Montjoi',     -- 식당이 아닌 가스트로노믹 아트 랩, 사전 예약 견학만 가능
  'Noma',                          -- 2025년 1월 공식 폐업 (Rene Redzepi 발표)
  'Faviken Magasinet (Closed)',     -- 2019년 12월 Magnus Nilsson 이 직접 폐업 결정
  'Coi',                           -- 2022년 5월 폐업 (chef Erik Anderson 퇴사 후 영업 중단)
  'L''Atelier de Joel Robuchon',   -- Joel Robuchon 2018년 8월 별세; 도쿄 플래그십 이후 폐업
  'Narisawa Nature Harmony',       -- 'Narisawa' 항목과 완전히 동일한 식당의 중복 항목
  'Ultraviolet Experience 1',      -- 'Ultraviolet by Paul Pairet' 와 동일 식당 중복 항목
  'Amass'                          -- Matt Orlando Copenhagen; 2022년 지속가능성 컨설팅 전환으로 폐업
);

-- 혹시 'N/A - Removed' 남아있을 경우 제거
DELETE FROM public.challenges
WHERE category = 'restaurants' AND title_en = 'N/A - Removed';


-- ================================================================
-- [2] RESTAURANTS — 검증된 운영중 레스토랑 9개 추가 (2024 기준)
-- ================================================================
INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES

-- El Bulli 대체: Basque 화염 요리의 성지
('restaurants','아사도르 에차바리','Asador Etxebarri','ES',
 'Victor Arguinzoniz 화염 요리; Axpe Basque Country, World''s Best #3 2023, Michelin 1성, 예약 필수',
 20),

-- elBulli 1846 대체: Basque 해안 전통 생선 구이
('restaurants','엘카노','Elkano','ES',
 'Aitor Arregi 통 터봇 숯불 구이; Getaria Gipuzkoa Basque Coast, World''s Best #12 2023',
 15),

-- Noma 대체: 코펜하겐 New Nordic 차세대 주자
('restaurants','요르드내르','Jordnær','DK',
 'Eric Vildgaard Michelin 2성; 일본-노르딕 해산물 테이스팅, Gentofte 코펜하겐 북부',
 15),

-- Faviken 대체: 스톡홀름 섬 위 2 Michelin Nordic
('restaurants','옥센 크로그','Oaxen Krog','SE',
 'Magnus Ek Michelin 2성; Djurgarden 섬 자연 속 식당, 스톡홀름, Nordic 해산물 제철 메뉴',
 15),

-- Coi 대체: 샌프란시스코 3 Michelin 이탈리안-캘리포니안
('restaurants','퀸스 샌프란시스코','Quince','US',
 'Michael Tusk Michelin 3성; Northern Italian-Californian, Jackson Square San Francisco',
 15),

-- L''Atelier Joel Robuchon 대체: 도쿄 3 Michelin 카이세키
('restaurants','류긴 도쿄','RyuGin','JP',
 'Seiji Yamamoto Michelin 3성; 과학적 카이세키, Roppongi-Nishiazabu Tokyo, 봄-여름-가을-겨울 시즌메뉴',
 20),

-- Narisawa Nature Harmony 대체: 도쿄 2 Michelin 네오 프렌치
('restaurants','플로리레쥬 도쿄','Florilège','JP',
 'Hiroyasu Kawate Michelin 2성; 혁신적 네오 프렌치 카운터 다이닝, Minami-Aoyama Tokyo',
 15),

-- Ultraviolet Experience 1 대체: 방콕 2 Michelin 딥사우스 타이
('restaurants','손 방콕','Sorn','TH',
 'Supaksorn Jongsiri Michelin 2성; 태국 남부 Deep South 요리, Asia 50 Best 첫 태국 레스토랑, Bangkok',
 15),

-- Amass 대체: 싱가포르 3 Michelin World''s Best
('restaurants','오데트 싱가포르','Odette','SG',
 'Julien Royer Michelin 3성; World''s Best #5 2023, National Gallery Singapore, 프랑스-아시아 혁신 요리',
 15);


-- ================================================================
-- [3] RESTAURANTS — 잘못된 설명 2건 수정 (폐업 아님, 설명 오류)
-- ================================================================

-- La Maison Troisgros: 2017년 Roanne 에서 Ouches 로 이전 (10km), 여전히 영업 중
UPDATE public.challenges
SET description_en = 'Michel Troisgros Michelin 3성; Ouches/Loire 2017 이전, 3세대 프랑스 오트 퀴진 왕조 50년+'
WHERE category = 'restaurants' AND title_en = 'La Maison Troisgros';

-- Restaurant Vendome: Bergisch Gladbach 은 바이에른(Bavaria)이 아닌 NRW(노르트라인-베스트팔렌)
UPDATE public.challenges
SET description_en = 'Joachim Wissler Michelin 3성; Schloss Bensberg estate, Bergisch Gladbach NRW Germany, 현대 유럽 요리'
WHERE category = 'restaurants' AND title_en = 'Restaurant Vendome';


-- ================================================================
-- [4] ART GALLERIES — Berardo Collection 교체
-- (2022년 포르투갈 법원 컬렉션 압수, 재단 해산 → 박물관 기능 종료)
-- ================================================================
DELETE FROM public.challenges
WHERE category = 'art_galleries' AND title_en = 'Berardo Collection Museum, Lisbon';

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES
('art_galleries','굴벤키안 미술관 리스본','Calouste Gulbenkian Museum, Lisbon','PT',
 'Rembrandt, Monet, Renoir, Lalique; 유럽 최고의 개인 컬렉션 중 하나, Parque das Laranjeiras Lisbon',
 15);


-- ================================================================
-- [5] MUSEUMS — Hara Museum of Contemporary Art Tokyo 교체
-- (하라 미술관: 2021년 1월 31일 폐관 후 구루메 이전, 도쿄 시나가와 원래 건물 폐관)
-- ================================================================
DELETE FROM public.challenges
WHERE category = 'art_galleries' AND title_en = 'Hara Museum of Contemporary Art, Tokyo';

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES
('art_galleries','도쿄 21_21 디자인 사이트','21_21 Design Sight, Tokyo','JP',
 'Tadao Ando 설계; Issey Miyake·Taku Satoh·Naoto Fukasawa 큐레이션, Roppongi Tokyo디자인 박물관',
 15);


-- ================================================================
-- 완료: 총 11개 삭제, 11개 신규 추가, 2개 설명 수정
-- 모두 2024년 기준 현재 영업중인 검증된 장소로 교체
-- ================================================================
