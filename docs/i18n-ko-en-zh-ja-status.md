# 한/영/중/일 번역 적용 현황

언어를 한글·영어·중국어·일본어로 선택했을 때 해당 언어로 표시되도록 한 작업 요약입니다.

---

## 이번에 반영한 범위

### 1. 메인 페이지 (`/[locale]`)

- **가이드 요청 섹션**: 제목, 부제, "모든 요청", "모집 중", "여행자", "가이드 요청 작성" → 번역 키 사용
- **명예의 전당**: 제목, "전체 순위 보기", "pts", 이름 폴백 "여행자"
- **인기 목적지**: 일본, 태국, 이탈리아 등 8개 국명 → `HomeSection.destJapan` 등
- **기능 소개 9개**: Find Companions, Find Guides, Guide Requests 등 제목·설명 → `featureFindCompanions` 등
- **시작하기 3단계**: Create profile, Find or post, Travel & review → `howStep1Title` 등
- **푸터**: Challenges, Dashboard, Bookmarks, Login / Sign up, All rights reserved → 번역 키 사용
- **날짜 표시**: locale에 따라 `ko-KR`, `ja-JP`, `zh-CN`, `en-US` 로 표시

### 2. 헤더 / 네비게이션

- **Nav** 네임스페이스에 추가: `language`, `currency`, `menu`
- **HeaderNav**: "Language", "Currency", "Menu" → `tNav('language')` 등으로 표시
- zh 로케일용 **Nav**에 `sponsors` 추가 (기존 누락 보완)

### 3. 홈 검색 (Hero 아래)

- **HomeSection**에 추가: `searchPlaceholder`, `searchHint`
- **Common**: 검색 버튼에 `search` 사용
- HomeSearch에서 placeholder·힌트·버튼 문구 모두 번역 키 사용

---

## 수정·추가된 파일

| 파일 | 내용 |
|------|------|
| `messages/en.json` | HomeSection·Nav 키 추가 (가이드 요청, 기능, 단계, 푸터, 검색, 목적지명, language/currency/menu 등) |
| `messages/ko.json` | 위와 동일 키 한글 번역 |
| `messages/zh.json` | 위와 동일 키 중국어 번역 + Nav.sponsors 추가 |
| `messages/ja.json` | 위와 동일 키 일본어 번역 |
| `src/app/[locale]/page.tsx` | 하드코딩 문자열 제거, `s()` / 번역 키 사용, 인기 목적지명 번역, 날짜 locale 처리 |
| `src/components/HeaderNav.tsx` | `useTranslations('Nav')`로 Language/Currency/Menu 번역 |
| `src/components/HomeSearch.tsx` | `useTranslations('HomeSection')`, `Common`으로 placeholder·힌트·검색 버튼 번역 |

---

## 다른 페이지에서 할 수 있는 작업

아직 모든 화면을 다 손대지 않았습니다. 아래처럼 진행하면 됩니다.

1. **영어로 하드코딩된 문구 찾기**  
   - `'...'` 또는 `"..."` 문자열, `confirm('...')`, `placeholder="..."` 등 검색
2. **해당 문구용 번역 키 정하기**  
   - 적절한 네임스페이스(예: `Companions`, `Dashboard`, `Common`)에 키 추가
3. **en/ko/zh/ja 네 개 메시지 파일에 동일 키로 값 넣기**
4. **컴포넌트에서** `useTranslations('네임스페이스')` 또는 `getTranslations({ locale, namespace })` **로 치환**

자주 쓰는 네임스페이스: `Nav`, `HomeSection`, `Common`, `Profile`, `Auth`, `Companions`, `Guides`, `Dashboard`, `Challenges` 등 (기존 `messages/en.json` 구조 참고).

---

## 확인 방법

1. 로컬에서 `npm run dev` 실행
2. 언어를 한글(ko) / 英语(zh) / 日本語(ja) / English(en)로 바꿔 가며
3. 메인 페이지, 헤더, 검색창, 푸터, 가이드 요청·명예의 전당·기능·시작하기 섹션이 선택한 언어로 나오는지 확인

이후 다른 페이지(로그인, 대시보드, 동행/가이드 목록 등)도 같은 방식으로 키를 추가하고 `t('key')`로 바꾸면 됩니다.
