# 구글 로그인 시 "우리 도메인"으로 보이게 하기

구글 로그인 시 **"kvvsttqlpablawsjgjiv.supabase.co(으)로 이동"** 대신 **mytripfy.com(또는 지정한 서브도메인)으로 이동**이 보이게 하는 방법입니다.

Supabase는 OAuth 콜백 주소를 **프로젝트 URL** 기준으로 만들어서, 기본값이 `https://[프로젝트ID].supabase.co`입니다.  
이걸 우리 도메인으로 바꾸려면 **Supabase Custom Domain**(커스텀 도메인)을 쓰면 됩니다.

---

## 전제 조건

- **Supabase 유료 플랜** (Custom Domain은 유료 애드온)
- **도메인** mytripfy.com 보유 (서브도메인 사용 가능해야 함. 예: `api.mytripfy.com`, `auth.mytripfy.com`)
- **DNS 설정** 권한 (CNAME, TXT 추가 가능)

---

## 1단계: Supabase에서 커스텀 도메인 준비

1. **Supabase Dashboard** 접속  
   → [Project Settings → General](https://supabase.com/dashboard/project/_/settings/general)

2. **Custom Domains** 섹션으로 이동  
   (유료 플랜/애드온이 없으면 여기서 활성화)

3. 사용할 **서브도메인** 정하기  
   - 예: `api.mytripfy.com` 또는 `auth.mytripfy.com`  
   - 루트 도메인(`mytripfy.com`)은 지원하지 않고 **서브도메인만** 가능합니다.

---

## 2단계: DNS 설정 (CNAME + 검증용 TXT)

Supabase 대시보드/CLI에서 안내하는 대로 진행합니다.

### 2-1. CNAME 추가

- **호스트**: 사용할 서브도메인 (예: `api` 또는 `auth`)
- **값(가리킬 주소)**: `kvvsttqlpablawsjgjiv.supabase.co`  
  (끝에 `.` 있는 형태로 안내되면 그대로 사용)

예시 (mytripfy.com 기준):

| 타입  | 이름(호스트) | 값                              |
|-------|--------------|----------------------------------|
| CNAME | api          | kvvsttqlpablawsjgjiv.supabase.co |

→ 결과: `api.mytripfy.com` → Supabase 프로젝트

### 2-2. 도메인 소유 검증용 TXT 추가

Supabase에서 **Custom Domain 등록/생성** 시 다음 중 한 방식으로 TXT 레코드를 받습니다.

- **대시보드**: Custom Domains 설정 화면에 표시되는 TXT
- **CLI**:  
  `supabase domains create --project-ref kvvsttqlpablawsjgjiv --custom-hostname api.mytripfy.com`  
  실행 시 출력되는 `_acme-challenge.api.mytripfy.com` TXT 값

해당 값을 DNS에 **정확히** 추가합니다.  
(일부 DNS는 호스트에 `api`만 넣고 도메인은 자동으로 붙이므로, 중복되지 않게 주의)

### 2-3. 검증 실행

- 대시보드: **Verify** 버튼
- CLI:  
  `supabase domains reverify --project-ref kvvsttqlpablawsjgjiv`  
  DNS 전파(몇 분~수십 분) 후 재시도할 수 있습니다.

---

## 3단계: Google Cloud Console에 리다이렉트 URI 추가

커스텀 도메인을 **활성화하기 전에** Google에 새 콜백 주소를 등록해야 합니다.

1. [Google Cloud Console](https://console.cloud.google.com/)  
   → **APIs & Services** → **Credentials**

2. Supabase용으로 쓰는 **OAuth 2.0 Client ID**(웹 클라이언트) 선택

3. **Authorized redirect URIs**에 다음을 **추가** (기존 supabase.co 주소는 유지해도 됨):
   ```text
   https://api.mytripfy.com/auth/v1/callback
   ```
   (사용한 서브도메인이 `auth.mytripfy.com`이면 `https://auth.mytripfy.com/auth/v1/callback`)

4. **저장**

---

## 4단계: Supabase에서 커스텀 도메인 활성화

- **대시보드**: Custom Domains에서 검증이 완료되면 **Activate** 실행  
- **CLI**:
  ```bash
  supabase domains activate --project-ref kvvsttqlpablawsjgjiv
  ```

활성화 후 Supabase Auth의 OAuth 콜백 주소가  
`https://[커스텀도메인]/auth/v1/callback` 로 사용됩니다.

---

## 5단계: 앱에서 Supabase URL을 커스텀 도메인으로 사용

OAuth 흐름(구글 로그인)이 우리 도메인을 쓰려면, **브라우저/앱이 호출하는 Supabase 주소**가 커스텀 도메인이어야 합니다.

1. **환경 변수**에서 Supabase URL을 커스텀 도메인으로 변경  
   - 예:  
     - `.env.production` 또는 배포 환경 변수  
     - `NEXT_PUBLIC_SUPABASE_URL=https://api.mytripfy.com`  
   - 기존: `NEXT_PUBLIC_SUPABASE_URL=https://kvvsttqlpablawsjgjiv.supabase.co`

2. **Vercel/호스팅** 등 프로덕션 환경에 위 값 설정 후 재배포

3. (선택) 로컬 개발은 기존 `kvvsttqlpablawsjgjiv.supabase.co` 유지하려면:
   - 로컬 `.env.local`에는 기존 URL 유지
   - 프로덕션만 `api.mytripfy.com` 사용

이후 구글 로그인 시:
- 리다이렉트 주소가 `https://api.mytripfy.com/auth/v1/callback` 로 전달되고
- 구글 화면에는 **"api.mytripfy.com(으)로 이동"** (또는 사용한 서브도메인)으로 표시됩니다.

---

## 6단계: Supabase Redirect URL 설정 확인

우리 앱이 로그인 후 돌아오는 주소는 이미 `redirectTo`로 설정되어 있습니다  
(예: `https://mytripfy.com/auth/callback`).

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**

2. **Redirect URLs**에 다음이 포함되어 있는지 확인:
   - `https://mytripfy.com/**` (또는 사용 중인 프로덕션 도메인)
   - 로컬: `http://localhost:3000/**`

3. **Site URL**을 프로덕션 도메인으로 설정  
   예: `https://mytripfy.com`

---

## 요약 체크리스트

| 순서 | 작업 |
|------|------|
| 1 | Supabase Custom Domain 애드온/유료 플랜 확인 |
| 2 | 서브도메인 결정 (예: api.mytripfy.com) |
| 3 | DNS: CNAME + TXT(검증) 추가 |
| 4 | Supabase에서 도메인 검증 및 활성화 |
| 5 | **활성화 전** Google Console에 `https://[커스텀도메인]/auth/v1/callback` 추가 |
| 6 | 프로덕션 환경 변수 `NEXT_PUBLIC_SUPABASE_URL` 을 커스텀 도메인으로 변경 후 배포 |
| 7 | Supabase URL Configuration에서 Redirect URLs, Site URL 확인 |

---

## 참고

- [Supabase Custom Domains](https://supabase.com/docs/guides/platform/custom-domains)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Login with Google (Supabase)](https://supabase.com/docs/guides/auth/social-login/auth-google)  
  → "Setup consent screen branding" / custom domain 안내

문제가 있으면 Supabase 대시보드의 Custom Domains 안내 문구와 Google Console의 redirect URI 오류 메시지를 함께 확인하면 됩니다.
