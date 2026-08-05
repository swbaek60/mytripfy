-- 여행 일정 테이블의 중복 인덱스 제거.
--
-- 성능 인덱스를 추가할 때 기존 인덱스와 겹치는 것을 못 보고 만들어, 완전히 같은 인덱스가
-- 두 벌씩 생겼다. 중복 인덱스는 조회를 빠르게 해 주지 않으면서 INSERT/UPDATE 마다 모두
-- 갱신되고 디스크와 캐시를 차지한다.
--
--  trip_activities (day_id, sort_order)  ← 완전히 동일한 두 인덱스
--  trip_days       (trip_id, day_number) ← 완전히 동일한 두 인덱스
--  trip_days       (post_id)             ← (post_id, day_number) 의 선두 열이므로 포함됨
--
-- 남기는 쪽은 열 구성이 이름에 드러나는 idx_* 규칙을 따른다.

DROP INDEX IF EXISTS public.trip_activities_day_id_idx;
DROP INDEX IF EXISTS public.trip_days_trip_id_idx;
DROP INDEX IF EXISTS public.trip_days_post_id_idx;
