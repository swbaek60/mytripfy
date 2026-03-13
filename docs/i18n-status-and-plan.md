# "아래 내용" 완료 여부 + 한/영/중/일 번역 현황

## 1. "아래 내용" 처리 완료 여부

**이미 완료된 작업:**

- **가입 후 바로 로그인**: 이메일·비밀번호 가입 시 세션이 오면 바로 홈으로 리다이렉트 (Confirm email 꺼짐일 때).
- **Confirm email 켜도 바로 로그인**: Confirm email을 켜도, 가입 직후 Admin API로 매직 링크를 생성해 그 링크로 리다이렉트해서 로그인되도록 구현함. 확인 메일은 Supabase가 그대로 발송.
- **구글/애플/페이스북 로그인 사용자**: 이메일 인증된 것으로 처리 (프로필 완성도 10점).
- **프로필 완성도에 이메일 인증 항목 추가**: 이메일 인증 시 10점, OAuth 사용자는 자동 인증 처리.
- **단계별 가이드**: `docs/signup-auto-login-with-confirm-email.md` 에 Supabase 설정·환경 변수·Redirect URL·재시작 방법 정리.
- **구글 로그인 콜백 404 해결**: `[locale]/auth/callback` 라우트 추가로 `/ko/auth/callback` 등 처리.

→ **위 "아래 내용"은 모두 반영된 상태입니다.**

---

## 2. 한/영/중/일 번역 현황

### 2.1 구조

- **next-intl** 사용. `messages/` 에 locale별 JSON (en, ko, zh, zh-TW, ja 등).
- 네임스페이스: HomePage, Nav, Hero, HomeSection, Common, Dashboard, Profile, Auth, ChallengesPage, HallOfFame, Sponsors 등.
- 컴포넌트에서는 `useTranslations('Namespace')` / `getTranslations({ locale, namespace: 'X' })` 로 사용.

### 2.2 문제점

1. **일부 locale에 영어 잔존**
   - 예: `ja.json` 의 `allRightsReserved` 가 "All rights reserved" 로 남아 있음.
   - 일부 키가 en만 있고 ko/zh/ja 에 없으면 fallback 으로 영어가 표시됨.

2. **isKo ? '한글' : 'English' 패턴**
   - 한/영만 지원하고 **중국어·일본어는 영어로 표시**됨.
   - 예: `DashboardCompletenessBanner`, `SponsorVisitList`, `reviews/mine`, `GuideDetailTabs`, `MyPostsSection` 등 다수.

3. **하드코딩된 영어**
   - "Edit Profile", "Submit Application", "Select country", "Saving...", "Back to store" 등이 코드에 직접 들어 있음.
   - 이런 부분은 번역 키가 없거나, 있어도 컴포넌트에서 t() 를 쓰지 않는 경우.

### 2.3 진행 방향

- **1단계**: ja/zh (및 필요 시 ko) 에서 값이 영어로 남아 있는 키를 해당 언어로 수정.
- **2단계**: `isKo ? ... : ...` 를 제거하고, **useTranslations / getTranslations** 와 메시지 키로 통일. (선택 언어가 ko/en/zh/ja 모두 올바르게 나오도록)
- **3단계**: 하드코딩 문자열을 번역 키로 교체하고, en/ko/zh/ja 네 개 파일에 동일 키 추가 후 컴포넌트에서 t() 사용.
- **4단계**: en/ko/zh/ja 구조를 맞춰 누락된 키 보완 (한 locale 에만 있는 키는 나머지 세 locale 에도 추가).

이 문서는 위 계획대로 **차근차근** 수정할 때의 기준 문서입니다.

---

## 3. 진행한 작업 (최근)

- **ja.json** `allRightsReserved`: "All rights reserved" → "著作権所有" 로 수정.
- **DashboardCompletenessBanner**: `isKo ? ... : ...` 제거 후 **Profile** 네임스페이스 번역 키 사용 (`completenessTitle`, `completenessNextPrefix`, `viewProfileLink`). en/ko/zh/ja 모두 해당 키 추가.
- **대시보드 Quick Links**: "Edit Profile" 등 하드코딩 제거 후 `t('editProfile')` 등 **Dashboard** 번역 사용.
- **zh.json / ja.json**: **Dashboard** 블록이 없어 대시보드에서 영어가 나오던 문제 수정. Dashboard 전체 키를 zh, ja 에 추가함.

### 아직 남은 작업 (우선순위)

- **MyPostsSection**, **SponsorVisitList**, **reviews/mine**, **GuideDetailTabs**, **Sponsors** 관련 등: `isKo ? '한글' : 'English'` → `useTranslations` + ko/zh/ja/en 키로 통일.
- **Common** 키 추가 후 하드코딩 교체: "Select country", "Saving...", "Submit Application", "Back to store" 등.
- 그 외 페이지별로 영어로만 되어 있는 문구를 네 가지 언어 메시지로 보완.
