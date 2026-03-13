# mytripfy 전체 점검 보고서

전체 흐름, 링크, 기획 일치 여부, 불필요 파일·DB 정리 항목을 정리했습니다.

---

## 1. 링크·흐름 이슈

### 1.1 이메일 링크 locale 반영 (적용 완료)

**위치**: `src/utils/emailTemplates.ts`

**적용 내용**:  
- 모든 이메일 템플릿에 `locale` 인자 추가 (기본값 `'en'`).  
- 푸터 "Preferences" 및 CTA 링크를 `${SITE_URL}/${locale}/...`로 생성.  
- 각 이메일 API에서 `process.env.DEFAULT_LOCALE || 'en'`(또는 contact-guide는 이미 사용 중인 locale)을 넘기도록 수정함.

---

### 1.2 앱 내부 라우팅

- **라우트**: 모든 페이지가 `[locale]` 아래에만 존재 (`/en/...`, `/ko/...` 등).
- **네비게이션**: Header, HeaderNav, Footer 모두 `/${locale}/...` 사용 → **일관됨**.
- **루트 `/`**: `next-intl` 미들웨어가 기본 locale로 리다이렉트 → **정상**.

---

### 1.3 알림(Notifications) 링크

**위치**: `src/app/[locale]/notifications/NotificationsList.tsx` → `getHref()`

**처리된 타입**  
- `message` + `group_chat` → 그룹 채팅  
- `message` + `user` → 1:1 메시지  
- `review` + `user` → 유저 프로필  
- `companion_post` → 동행 글  
- `guide_request` → 가이드 요청  

**적용 완료**:  
application, accepted, rejected → `/dashboard`; guide_application, guide_match, guide_request_match → `/guides/requests`; question, answer, companion → `/companions`; 그 외 → `/notifications` 로 연결하도록 `getHref()` 보완함.

---

## 2. 불필요·미사용 API 제거 (적용 완료)

| API 경로 | 조치 |
|----------|------|
| `GET /api/profiles?ids=...` | 사용처 없음 확인 후 **제거함** (`src/app/api/profiles/route.ts` 삭제). |
| `GET /api/group-chat/profiles?chatId=xxx` | 사용처 없음 확인 후 **제거함** (`src/app/api/group-chat/profiles/route.ts` 삭제). |

---

### 2.2 기타 API

- **`/api/update-rates`**: 프론트에서 호출하지 않음. Vercel Cron 등 **서버/스케줄러 전용**으로 사용 중이면 유지.
- **`/api/rates`**: `CurrencyContext`에서 사용 → **사용 중**.

---

## 3. DB·스키마 정리

### 3.1 앱에서 실제 사용 중인 테이블·뷰 (참고용)

- **profiles**, **visited_countries**, **companion_posts**, **companion_applications**, **companion_questions**
- **guide_requests**, **guide_applications**
- **bookmarks**, **notifications**, **reviews**
- **chats**, **chat_participants**, **messages**
- **challenges**, **challenge_translations**, **challenge_certifications**, **challenge_disputes**, **challenge_wishes**
- **hall_of_fame_leaderboard**, **contribution_leaderboard**, **overall_leaderboard**
- **sponsors**, **sponsor_benefits**, **sponsor_visits**, **sponsor_visit_disputes**
- **trips**, **trip_days**, **trip_activities**
- **exchange_rates**, **travel_personalities**
- **Storage 버킷**: `photos`, `avatars`, `certifications`

위 목록은 코드 기준이며, RLS/트리거용 테이블이 더 있을 수 있습니다.

### 3.2 스키마 파일 개수

- `supabase/` 아래 **schema*.sql** 파일이 **70개 이상**입니다.  
- 버전별 마이그레이션 이력으로 보이며, 이미 적용된 스키마를 함부로 삭제하면 이력이 꼬일 수 있습니다.

**권장**:  
- 삭제보다는, **현재 프로덕션 DB 상태를 하나의 “통합 스키마” SQL로 정리해 두는 것**을 권장합니다.  
- **`supabase/README-migrations.md`**에 위 권장 방식을 문서화해 두었습니다.

### 3.3 v44: sponsors lat/lng 제거 (적용 권장)

- `schema-v44-sponsors-drop-lat-lng.sql`: `sponsors` 테이블에서 `lat`, `lng` 컬럼 제거.  
- 앱은 주소·지도 링크만 사용하므로 **아직 적용 전이면 Supabase SQL Editor에서 v44 실행 권장.**  
- 실행 방법은 `supabase/README-migrations.md`에 정리해 두었습니다.

---

## 4. 기획 의도와의 일치 여부

- **가이드·동행·스폰서·챌린지·Hall of Fame·메시지·리뷰·프로필** 등 핵심 플로우는 모두 `[locale]` 기반으로 연결되어 있어, 다국어 기획과 일치합니다.  
- **이메일**도 1.1에서 locale 반영을 적용해 두었습니다.

---

## 5. 정리 체크리스트

| 구분 | 항목 | 조치 |
|------|------|------|
| 링크 | 이메일 CTA/푸터 링크 | ✅ `locale` 인자로 `/${locale}/...` 생성 적용 |
| API | `/api/profiles` | ✅ 제거함 |
| API | `/api/group-chat/profiles` | ✅ 제거함 |
| DB | 스키마 파일 | ✅ README-migrations.md로 권장 방식 정리 |
| DB | v44 (sponsors lat/lng) | ✅ 미적용 시 적용 권장 (README에 안내) |
| 알림 | getHref 미처리 타입 | ✅ 타입별 기본 링크 추가 (dashboard, guides/requests, companions, notifications) |

---

*작성일: 2025-02-26*
