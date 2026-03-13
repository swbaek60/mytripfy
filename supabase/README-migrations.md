# Supabase 스키마 마이그레이션 가이드

## 권장 방식

1. **기존 schema-v1 ~ schema-v44 파일**  
   - 이력으로 보관합니다. 삭제하지 마세요.

2. **새 스키마 변경**  
   - `schema-v45-설명.sql`, `schema-v46-설명.sql` 형태로 추가합니다.  
   - Supabase SQL Editor에서 **순서대로** 실행한 뒤, 프로덕션과 동기화했는지 확인합니다.

3. **통합 스키마**  
   - 새 환경 구축 시: `schema.sql` → `schema-v2.sql` … → `schema-v44.sql` 순으로 실행합니다.  
   - 필요 시 현재 프로덕션 상태를 하나의 통합 SQL로 정리해 두고, 그 이후 변경만 v45+ 로 관리할 수 있습니다.

---

## 지금 적용 권장: v44 (sponsors lat/lng 제거)

앱은 **주소·지도 링크만** 사용하고, `sponsors` 테이블의 `lat`, `lng` 컬럼은 사용하지 않습니다.

**아직 적용 전이라면** Supabase SQL Editor에서 아래 파일을 실행하세요.

- **파일**: `schema-v44-sponsors-drop-lat-lng.sql`
- **내용**: `sponsors` 테이블에서 `lat`, `lng` 컬럼 제거

```sql
ALTER TABLE public.sponsors
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lng;
```

이미 적용된 DB라면 추가 작업 없습니다.
