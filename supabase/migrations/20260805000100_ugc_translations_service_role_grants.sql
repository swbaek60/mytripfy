-- 번역 캐시에 대한 service_role DML 권한 복구.
--
-- RLS 잠금 마이그레이션은 anon/authenticated 의 직접 접근을 막기 위해 public 스키마
-- 전체에서 권한을 회수했는데, ugc_translations 는 그 뒤 service_role 재부여 목록에
-- 빠져 있었다. 그 결과 서버 API 의 admin 클라이언트조차 캐시를 읽거나 쓸 수 없어
-- 번역 결과가 저장되지 않았고, 같은 문장을 볼 때마다 외부 번역 API 를 다시 호출했다.
--
-- RLS 는 켜진 상태이고 정책이 하나도 없으므로 anon/authenticated 는 여전히 차단된다.
-- service_role 은 RLS 를 우회하므로 테이블 권한만 돌려주면 된다.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ugc_translations TO service_role;

REVOKE ALL ON public.ugc_translations FROM anon, authenticated;
