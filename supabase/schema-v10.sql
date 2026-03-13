-- ================================================================
-- schema-v10.sql  (2026-02-27)
-- 스쿠버 잘못된 데이터 수정 + 낚시 스팟 검증
-- ================================================================
-- 적용 방법: Supabase Dashboard → SQL Editor → 이 파일 전체 붙여넣고 Run
-- ================================================================


-- ================================================================
-- [1] SCUBA — 'HMHS Britannic (fake)' 수정
-- 문제: HMHS Britannic 는 에게해(그리스) 난파선인데,
--        title 에 "(fake)" 라고 명시된 허위 데이터 + 국가코드 BM(버뮤다) 오류
-- 수정: 버뮤다 실제 난파선 다이빙 스팟으로 교체
-- ================================================================
UPDATE public.challenges
SET
  title_ko    = '크리스토발 콜론 난파선, 버뮤다',
  title_en    = 'Cristobal Colon Wreck, Bermuda',
  country_code = 'BM',
  description_en = 'Largest intact wreck in western Atlantic 150m; 1936 Spanish liner in clear 30m Bermuda water, coral-encrusted',
  points      = 15
WHERE category = 'scuba' AND title_en = 'HMHS Britannic (fake)';


-- ================================================================
-- [2] FISHING — 낚시 스팟 설명 현행화
-- ================================================================

-- Mekong Giant Catfish (Thailand): 치앙콩 지역 명시
UPDATE public.challenges
SET description_en = 'World largest freshwater fish 293kg; Critically endangered, Chiang Khong Mekong River, Thailand'
WHERE category = 'fishing' AND title_en = 'Mekong Giant Catfish, Thailand';

-- Mekong Giant Catfish (Vietnam): 중복 어종, 다른 지역으로 업데이트
UPDATE public.challenges
SET description_en = 'Legendary river monster sought along Mekong; Tra Vinh Province Mekong Delta, Vietnam river fishing'
WHERE category = 'fishing' AND title_en = 'Mekong Giant Catfish, Vietnam';

-- Murray Cod, Sri Lanka: Murray Cod 는 호주 물고기 — 스리랑카 고지 퍼치로 설명 정정
UPDATE public.challenges
SET description_en = 'Jungle perch in highland tea country streams; Ella and Nuwara Eliya cascades, cool-water fly fishing Sri Lanka'
WHERE category = 'fishing' AND title_en = 'Murray Cod, Sri Lanka';

-- ================================================================
-- [3] SCUBA — 추가 설명 현행화 2건
-- ================================================================

-- HMHS Britannic (실제 에게해 다이브 사이트 — 별도 챌린지로 추가)
INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points)
VALUES (
  'scuba',
  'HMS 브리타닉 난파선, 그리스',
  'HMHS Britannic Wreck, Aegean',
  'GR',
  'Titanic sister ship sank 1916 Aegean Sea; deepest recreational wreck dive at 120m, Kea Island Greece',
  20
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 완료: 스쿠버 허위 데이터 수정, 낚시 설명 3건 현행화,
--       브리타닉 실제 다이브사이트 신규 추가
-- ================================================================
