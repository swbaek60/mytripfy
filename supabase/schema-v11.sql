-- ================================================================
-- schema-v11.sql  (2026-02-27)
-- 100 Nature Spots → 5개 신규 항목 추가 (95 → 100개)
-- ================================================================
-- 적용 방법: Supabase Dashboard → SQL Editor → 이 파일 전체 붙여넣고 Run
-- ================================================================

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points)
VALUES

-- 1. 와이토모 글로우웜 동굴 (뉴질랜드) — 이전 v6.sql 에 있었으나 v6-fix.sql 에서 누락
('nature',
 '와이토모 글로우웜 동굴',
 'Waitomo Glowworm Caves, New Zealand',
 'NZ',
 'Arachnocampa luminosa bioluminescent ceiling; thousands of glowworms create Milky Way underground, underground boat ride',
 10),

-- 2. 후지산 (일본) — 일본 최고 상징 화산, 유네스코 세계문화유산
('nature',
 '후지산',
 'Mount Fuji, Japan',
 'JP',
 'Japan iconic volcano 3776m; UNESCO Cultural Heritage, cherry blossom foreground, Lake Kawaguchi reflection classic',
 15),

-- 3. 사해 (요르단/이스라엘) — 지구에서 가장 낮은 곳, 소금호수
('nature',
 '사해',
 'Dead Sea, Jordan',
 'JO',
 'Earth lowest point -430m; 34% salinity allows floating; mineral-rich mud therapy, disappearing lake ecosystem',
 10),

-- 4. 트롤퉁가 (노르웨이) — 극적인 절벽 하이킹 명소
('nature',
 '트롤퉁가',
 'Trolltunga, Norway',
 'NO',
 'Troll tongue cliff 700m above Lake Ringedalsvatnet; 22km round-trip hike, most dramatic Norway photo spot',
 15),

-- 5. 하바수 폭포 (애리조나) — 그랜드캐년 하바수파이 부족 영토의 에메랄드빛 폭포
('nature',
 '하바수 폭포',
 'Havasu Falls, Arizona',
 'US',
 'Turquoise-blue travertine waterfalls; Havasupai tribal land Grand Canyon, permit required, 16km hike each way',
 15);

-- ================================================================
-- 완료: 95 → 100개 (Waitomo, Fuji, Dead Sea, Trolltunga, Havasu Falls)
-- ================================================================
