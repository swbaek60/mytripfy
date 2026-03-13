# Apple / Facebook 로그인 설정 가이드

로그인 화면의 **Continue with Apple** / **Continue with Facebook** 버튼은  
Supabase와 각 플랫폼에서 설정을 마친 뒤에만 사용할 수 있습니다.

현재는 **Google + 이메일** 로그인만 노출되며,  
아래 설정을 완료한 후 환경 변수를 켜면 Apple/Facebook 버튼이 나타납니다.

---

## 1단계: 지금 상태 (에러 없이 사용)

- **Apple / Facebook 버튼**은 환경 변수가 `true`일 때만 표시됩니다.
- Vercel·로컬 모두 **설정하지 않으면** 두 버튼은 **나타나지 않으므로**  
  `Unsupported provider` / `앱 ID 오류` 같은 에러는 발생하지 않습니다.
- **Google + 이메일** 로그인만 사용 중이라면 추가 작업은 필요 없습니다.

---

## 2단계: Facebook 로그인 사용하려면

### 2-1. Facebook 앱 만들기

1. [Facebook for Developers](https://developers.facebook.com/) 로그인
2. **내 앱** → **앱 만들기** → 앱 유형 선택(예: **소비자**)
3. 앱 이름·연락처 입력 후 만들기

### 2-2. Facebook 로그인 설정

1. 앱 대시보드에서 **Facebook 로그인** → **설정**
2. **유효한 OAuth 리디렉션 URI**에 아래 주소 **추가**  
   `https://kvvsttqlpablawsjgjiv.supabase.co/auth/v1/callback`
3. **저장**
4. 왼쪽 **설정** → **기본** 에서  
   - **앱 ID** 복사  
   - **앱 시크릿** → **표시** 후 복사

### 2-3. Supabase에 입력

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택
2. **Authentication** → **Providers** → **Facebook**
3. **Enable** 켜기
4. **Client ID (App ID)** 에 Facebook **앱 ID** 붙여넣기
5. **Client Secret** 에 Facebook **앱 시크릿** 붙여넣기
6. **Save**

### 2-4. 버튼 노출

- **Vercel**: Settings → Environment Variables  
  - `NEXT_PUBLIC_ENABLE_FACEBOOK_SIGNIN` = `true` (Production 등 원하는 환경)
- **로컬**: `.env.local`에  
  - `NEXT_PUBLIC_ENABLE_FACEBOOK_SIGNIN=true`  
  추가 후 재시작

이후 배포/새로고침하면 **Continue with Facebook** 버튼이 보입니다.

---

## 3단계: Apple 로그인 사용하려면

Apple은 **Apple Developer 계정**(유료)과 설정이 필요합니다.

### 3-1. Apple Developer에서 설정

1. [Apple Developer](https://developer.apple.com/) 로그인
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. **App IDs**에서 앱용 App ID가 있다면 그대로, 없으면 새로 생성
4. **Services IDs**에서 **Sign in with Apple**용 Services ID 생성  
   - 설명: 예) MyTripfy Web  
   - Identifier: 예) `com.mytripfy.web` (고유한 값)
5. 해당 Services ID에서 **Sign in with Apple** 체크 → **Configure**
   - **Domains**: `mytripfy.com`, `www.mytripfy.com`
   - **Return URLs**:  
     `https://kvvsttqlpablawsjgjiv.supabase.co/auth/v1/callback`
6. **Keys**에서 **Sign in with Apple**용 키 생성  
   - 키 이름 입력 → **Sign in with Apple** 체크 → Configure (위 App ID 선택)  
   - 키 파일(.p8) 다운로드 (한 번만 가능, 보관 필수)  
   - **Key ID** 복사
7. **Identifiers** → **Services IDs** → 해당 ID에서 **Primary App ID**, **Team ID**, **Services ID** 확인

### 3-2. Supabase에 입력

1. Supabase **Authentication** → **Providers** → **Apple**
2. **Enable** 켜기
3. 다음 값 입력:
   - **Services ID** (예: `com.mytripfy.web`)
   - **Secret Key**: .p8 파일 내용 전체 붙여넣기
   - **Key ID**, **Team ID**, **App Bundle ID** (App ID의 Bundle ID)
4. **Save**

(정확한 필드명은 Supabase UI 기준으로 확인해 주세요.)

### 3-3. 버튼 노출

- **Vercel**: `NEXT_PUBLIC_ENABLE_APPLE_SIGNIN` = `true`
- **로컬**: `.env.local`에 `NEXT_PUBLIC_ENABLE_APPLE_SIGNIN=true`

**참고:** Apple 시크릿 키는 **6개월마다 재발급**이 필요합니다.  
[Supabase 문서 – Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)

---

## 요약

| 항목 | 지금 | Facebook 쓰려면 | Apple 쓰려면 |
|------|------|------------------|--------------|
| 로그인 화면 | Google + 이메일만 표시 | Supabase Facebook 설정 + env `true` | Supabase Apple 설정 + env `true` |
| 환경 변수 | 없음(버튼 숨김) | `NEXT_PUBLIC_ENABLE_FACEBOOK_SIGNIN=true` | `NEXT_PUBLIC_ENABLE_APPLE_SIGNIN=true` |

설정 전에는 두 버튼이 보이지 않으므로, 위 단계를 진행한 뒤에만 해당 버튼을 켜면 됩니다.
