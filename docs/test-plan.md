# mytripfy 전체 테스트 계획

## 1. 테스트 레이어

| 레이어 | 목적 | 실행 |
|--------|------|------|
| **Smoke** | 주요 페이지가 200으로 로드되는지 | `e2e/smoke.spec.ts` |
| **Navigation** | 홈·로그인·공개 페이지의 링크/버튼이 올바른 경로로 연결되는지 | `e2e/navigation.spec.ts` |
| **Auth** | 로그인/회원가입 폼, 소셜 로그인, OAuth 시작/콜백 | `e2e/auth.spec.ts`, `e2e/facebook-login-mobile.spec.ts` |
| **API** | 주요 API 엔드포인트가 기대 상태 코드를 반환하는지 | `e2e/api-health.spec.ts` |

## 2. Smoke – 페이지 로드

| URL | 기대 |
|-----|------|
| `/` | 200, locale 리다이렉트 또는 홈 콘텐츠 |
| `/en` | 200, 홈 |
| `/en/login` | 200, 로그인 폼·소셜 버튼 |
| `/en/companions` | 200 |
| `/en/guides` | 200 |
| `/en/guides/requests` | 200 |
| `/en/trips` | 200 |
| `/en/sponsors` | 200 |
| `/en/challenges` | 200 |
| `/en/hall-of-fame` | 200 |
| `/en/privacy` | 200 |
| `/en/dashboard` | 200 또는 로그인 리다이렉트 |
| `/en/profile` | 200 또는 로그인 리다이렉트 |
| `/en/bookmarks` | 200 또는 로그인 리다이렉트 |
| `/en/notifications` | 200 또는 로그인 리다이렉트 |
| `/en/messages` | 200 또는 로그인 리다이렉트 |

## 3. Navigation – 링크·버튼 연결

| 페이지 | 요소 | 기대 동작 |
|--------|------|-----------|
| `/en` | Companions, Guides, Login 등 CTA | 해당 경로로 이동 |
| `/en` | 푸터 Privacy 등 | `/en/privacy` 등 |
| `/en/login` | 이메일 로그인/회원가입 버튼 | formAction 존재, 제출 시 리다이렉트 |
| `/en/login` | Google/Apple/Facebook 버튼 | form action `/api/auth/oauth-start`, target _self |
| `/en/companions` | New post, Login 링크 | `/en/companions/new`, `/en/login` |
| `/en/guides` | Request guide, Login | `/en/guides/requests/new`, `/en/login` |
| `/en/privacy` | 홈 링크 | `/en` |

## 4. Auth – 로그인·OAuth

| 시나리오 | 기대 |
|----------|------|
| 로그인 페이지 진입 | 이메일/비밀번호 필드, 로그인·회원가입·소셜 버튼 표시 |
| 소셜 버튼 클릭 (Facebook) | 새 창 미오픈, 같은 탭에서 oauth-start 또는 OAuth로 이동 |
| GET /api/auth/oauth-start?provider=facebook&locale=en | 모바일 UA → 200 HTML (form submit), 데스크톱 UA → 302 |
| GET /api/auth/oauth-start?provider=invalid | 302 → /en/login?message=Invalid+provider |
| 콜백 (코드 없음) | 실패 리다이렉트 처리 |
| locale 유지 | oauth-start 응답에 mytripfy_oauth_locale 쿠키, /ko/login → 소셜 후 /ko 유지 |

## 5. API – 상태 검증

| 메서드 | 경로 | 기대 (비인증 허용 시) |
|--------|------|------------------------|
| GET | /api/rates | 200 |
| GET | /api/auth/oauth-start?provider=facebook&locale=en | 200(모바일) 또는 302(데스크톱) |
| GET | /api/profile/completeness | 401 또는 200 (인증 의존) |
| GET | /api/challenge-image?… | 200 또는 400/404 |

## 6. 실행 방법

**사전 조건:** E2E는 `http://localhost:3000`에서 동작하는 앱을 대상으로 합니다.

```bash
# 방법 A: 서버 자동 기동 (첫 실행 시 최대 약 2분 대기 후 테스트 시작)
npm run test:e2e

# 방법 B: 이미 다른 터미널에서 npm run dev 로 서버를 띄운 경우 (빠른 재실행)
npm run test:e2e:no-server

# 데스크톱 프로젝트만 실행 (모바일 제외, 시간 단축)
npm run test:e2e:desktop

# 특정 스펙만 실행
npx playwright test e2e/smoke.spec.ts
npx playwright test e2e/navigation.spec.ts
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/api-health.spec.ts
npx playwright test e2e/facebook-login-mobile.spec.ts
```

**참고:** `test:e2e:no-server` 사용 시 반드시 먼저 `npm run dev`로 서버를 켜 두어야 합니다. 서버가 꺼져 있으면 API/페이지 요청이 실패해 테스트가 실패합니다.

## 7. 통과 기준

- Smoke: 모든 대상 URL 200 (또는 의도한 리다이렉트).
- Navigation: 클릭 시 예상 URL로 이동.
- Auth: 소셜 클릭 시 새 창 미오픈, oauth-start·쿠키·locale 동작 일치.
- API: 위 표의 상태 코드 일치.
- 기존 `facebook-login-mobile.spec.ts`: 12개 테스트 통과 유지.
