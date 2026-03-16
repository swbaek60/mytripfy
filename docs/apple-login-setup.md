# Continue with Apple 설정 (한 단계씩)

로그인 화면의 **Continue with Apple**을 사용하려면 **Apple Developer** 설정과 **Supabase Apple Provider** 설정을 순서대로 진행하면 됩니다.  
아래는 **한 번에 하나씩만** 따라 하면 되도록 단계를 나눈 것입니다.

---

## 준비

- **Apple Developer 계정**이 있어야 합니다. (유료, 연회비) [developer.apple.com](https://developer.apple.com/) 에서 가입·갱신.
- **무료 계정으로는 안 됩니다.** Sign in with Apple(웹)을 쓰려면 **App ID**, **Services ID**, **Keys** 를 만들어야 하는데, 이 메뉴들은 모두 **Certificates, Identifiers & Profiles** 안에 있습니다. Apple 정책상 이 메뉴는 **유료 Apple Developer Program 멤버십**이 있을 때만 사용할 수 있습니다. 무료 Apple ID로 로그인한 “무료 개발자 계정”만으로는 접근이 제한되므로, **연간 멤버십(유료)** 이 필요합니다.
- **유료 구독 직후:** 결제가 끝나도 **"대기 중"**, **"멤버십을 구입하시기 바랍니다"**, **"구입 처리에 최대 48시간 소요"** 라고 나올 수 있습니다. 이때는 **Certificates, Identifiers & Profiles** 메뉴가 안 보이거나 접근이 제한될 수 있습니다. **멤버십이 활성화될 때까지(보통 24~48시간 이내) 기다린 뒤** 다시 로그인해 보세요. 활성화되면 해당 메뉴가 보입니다.
- **Supabase 프로젝트 URL**을 알아 두세요.  
  Supabase 대시보드 → **Project Settings** → **API** → **Project URL**  
  예: `https://xxxxx.supabase.co`  
  → 콜백 주소는 `https://xxxxx.supabase.co/auth/v1/callback` 입니다.

---

## 1단계: Apple Developer 접속 (자세히)

이 단계에서는 **Apple Developer 웹사이트에 들어가서, 나중에 App ID·Services ID·키를 만들 수 있는 메뉴**까지 이동하는 것이 목표입니다.

---

### 1-1. 사이트 열기

1. 브라우저 주소창에 **developer.apple.com** 을 입력하거나, [developer.apple.com](https://developer.apple.com/) 링크를 엽니다.
2. Apple Developer **메인 페이지**가 열립니다.

---

### 1-2. 로그인

1. 페이지 **오른쪽 위**를 봅니다.
2. **Account** (계정) 또는 **Sign in** (로그인) 버튼이 있으면 클릭합니다.
3. **Apple ID** (이메일)와 **비밀번호**를 입력해 로그인합니다.
   - Apple Developer **유료 프로그램**에 가입되어 있어야 합니다. 아직 아니면 [developer.apple.com/programs](https://developer.apple.com/programs/) 에서 가입 후 진행하세요.
4. 로그인이 끝나면 **계정/대시보드** 화면으로 이동합니다.

---

### 1-3. Certificates, Identifiers & Profiles 로 들어가기

로그인 후 **어디를 눌러야 하는지**는 화면 구성에 따라 조금 다를 수 있습니다. 아래 중 하나로 들어가면 됩니다.

**방법 A (상단 메뉴)**

1. 페이지 **상단** 메뉴에서 **Account** (계정) 를 클릭합니다.
2. 계정 페이지 왼쪽 또는 본문에 **Certificates, Identifiers & Profiles** (인증서, 식별자 및 프로파일) 라는 항목이 있으면 클릭합니다.

**방법 B (직접 주소)**

1. 브라우저 주소창에 아래 주소를 입력해 이동합니다.  
   **https://developer.apple.com/account/resources/**  
   또는  
   **https://developer.apple.com/account**  
2. 나오는 메뉴에서 **Certificates, Identifiers & Profiles** 를 선택합니다.

**방법 C (검색)**

1. Apple Developer 사이트 안에서 **Certificates** 또는 **Identifiers** 를 검색합니다.
2. **Certificates, Identifiers & Profiles** 로 들어가는 링크를 클릭합니다.

---

### 1-4. 들어온 후 확인

- **Certificates, Identifiers & Profiles** 화면이 열리면 1단계는 완료입니다.
- 이 화면 왼쪽에는 **Certificates**, **Identifiers**, **Devices**, **Profiles**, **Keys** 같은 메뉴가 보입니다.
- **2단계**에서는 여기서 **Identifiers** 를 눌러 **App ID**를 만들거나 확인합니다.

**여기까지 완료했으면 다음 2단계로 넘어가면 됩니다.**

---

## 2단계: App ID 확인 또는 생성

1. 왼쪽에서 **Identifiers** 를 클릭합니다.
2. 상단 필터에서 **App IDs** 를 선택합니다.
3. **+** 버튼(새로 만들기)을 누릅니다.
4. **App** 을 선택하고 **Continue** 합니다.
5. **Description** 에 예: `MyTripfy` 처럼 앱 설명을 넣습니다.
6. **Bundle ID** 는 **Explicit** 를 선택한 뒤, 예: `com.mytripfy.app` 처럼 고유한 값을 넣습니다. (실제로 iOS 앱이 있으면 그 Bundle ID를 쓰면 됩니다.)
7. **Capabilities** 목록에서 **Sign in with Apple** 에 체크합니다.
8. **Continue** → **Register** 로 저장합니다.

**이미 사용 중인 App ID가 있고 Sign in with Apple 이 켜져 있으면, 새로 만들지 않고 그 App ID를 쓰면 됩니다.**  
**여기까지 완료했으면 다음 단계로.**

---

## 3단계: Services ID 생성 (자세히)

**Services ID**는 “웹에서 Sign in with Apple을 쓰는 서비스”를 구분하는 ID입니다. 나중에 Supabase **Services ID(Client ID)** 란에 넣을 값이 됩니다.

---

### 3-1. Services IDs 를 찾는 방법 (못 찾을 때 보세요)

Apple Developer 사이트는 디자인이 바뀌어서 **Identifiers**나 **Services IDs**가 예전 위치에 없을 수 있습니다. 아래 **A·B·C** 중 하나로 시도해 보세요.

---

**방법 A: 왼쪽 메뉴에서 Identifiers → 타입 선택**

1. **Certificates, Identifiers & Profiles** 화면이어야 합니다.  
   - 안 보이면: [developer.apple.com/account](https://developer.apple.com/account) 접속 → **Certificates, Identifiers & Profiles** 링크 클릭.
2. **왼쪽 사이드바**를 보세요.  
   - **Identifiers** 라는 항목이 있으면 클릭합니다.  
   - 왼쪽에 **Resources** 같은 제목 아래에 **Identifiers**가 있을 수도 있습니다.
3. Identifiers 페이지가 열리면 **한 목록**이 보입니다.  
   - **상단**에 **드롭다운** 또는 **필터**가 있으면 열어 봅니다.  
   - **"App IDs"**, **"Services IDs"**, **"Pass Type IDs"** 등이 있으면 **Services IDs** 를 선택합니다.  
   - 그러면 **Services IDs**만 보이는 목록(또는 빈 목록)으로 바뀝니다.
4. **"Services IDs" 라는 탭/버튼**이 상단에 따로 있으면 그것을 클릭해도 됩니다.

---

**방법 B: "새 Identifier 만들기" 로 들어가서 타입 고르기**

1. **Certificates, Identifiers & Profiles** 화면으로 갑니다.
2. **Identifiers** 를 클릭해 Identifiers 목록 페이지로 갑니다.
3. **+** 버튼 또는 **Create a new identifier** (새 식별자 만들기) 를 클릭합니다.
4. **타입 선택** 화면이 나옵니다.  
   - **Services IDs** 가 보이면 선택하고 **Continue** 합니다.  
   - 그러면 Services ID 등록 폼으로 넘어가므로, 아래 **3-3, 3-4, 3-5** 로 이어가면 됩니다.  
   - (목록에서 "Services IDs만 보기"를 안 해도, 새로 만들 때 **Services IDs** 타입을 고르면 됩니다.)

---

**방법 C: 직접 주소로 Services IDs 목록 열기**

1. 브라우저 주소창에 아래 주소를 **그대로** 입력해 이동해 봅니다.  
   **https://developer.apple.com/account/resources/identifiers/list/serviceId**  
2. 로그인되어 있으면 **Services IDs** 목록(또는 빈 목록) 화면이 나올 수 있습니다.  
3. 여기서 **+** 버튼으로 새 Services ID를 만들 수 있습니다.

---

**정리**

- **"Identifiers"** = 상단/왼쪽 메뉴의 **Identifiers** 링크.
- **"Services IDs"** = Identifiers 안에서 **타입을 "Services IDs"로 필터**한 보기이거나, **새로 만들 때 고르는 타입** 이름입니다.  
- 그래도 안 보이면 **방법 B**대로 **+** 또는 **Create a new identifier** 를 누르고, 다음 화면에서 **Services IDs** 를 선택하면 됩니다.

---

### 3-2. 새 Services ID 만들기

1. **+** 버튼(또는 **Create a new identifier** / **새로 만들기**)을 클릭합니다.
2. **Services IDs** 를 선택하고 **Continue** 를 누릅니다.

---

### 3-3. Description 입력

1. **Description** 란에 서비스를 구분할 수 있는 이름을 넣습니다.  
   예: `MyTripfy Web` 또는 `mytripfy website`  
   (나중에 목록에서 찾을 때 쓰입니다.)

---

### 3-4. Identifier 입력

1. **Identifier** 란에 **고유한 문자열**을 넣습니다.  
   예: `com.mytripfy.web`  
   - 보통 **역도메인 형식**으로 씁니다. (com.회사명.서비스명 등)
   - **이 값**을 나중에 **Supabase Apple Provider** 의 **Services ID** 란에 그대로 넣습니다.
   - 다른 앱에서 이미 쓰는 값이면 안 되므로, 본인만 쓰는 고유한 값으로 정하세요.

---

### 3-5. 저장

1. **Continue** 를 클릭합니다.
2. 내용을 확인한 뒤 **Register** 를 클릭합니다.
3. **Services ID** 가 목록에 추가되면 3단계 완료입니다.

**여기까지 완료했으면 다음 4단계(Services ID에서 Sign in with Apple 설정)로 넘어가면 됩니다.**

---

## 4단계: Services ID 에서 Sign in with Apple 설정

1. 방금 만든 **Services ID** (예: com.mytripfy.web) 를 목록에서 클릭합니다.
2. **Sign in with Apple** 옆 **Configure** 를 클릭합니다.
3. **Primary App ID** 에서 2단계에서 만든 **App ID** 를 선택합니다.
4. **Domains and Subdomains** 에 사이트 도메인을 넣습니다.  
   - 예: `mytripfy.com` 한 줄  
   - 필요하면 `www.mytripfy.com` 도 한 줄 추가
5. **Return URLs** 에 Supabase 콜백 주소를 넣습니다.  
   - 형식: `https://<본인_Supabase_Project_URL>/auth/v1/callback`  
   - 예: `https://kvvsttqlpablawsjgjiv.supabase.co/auth/v1/callback`
6. **Save** → **Continue** → **Save** 로 저장합니다.

**여기까지 완료했으면 다음 단계로.**

---

## 5단계: Key 생성 (Sign in with Apple)

1. 왼쪽에서 **Keys** 를 클릭합니다.
2. **+** 버튼으로 새 키를 만듭니다.
3. **Key Name** 에 예: `MyTripfy Apple Sign In` 처럼 이름을 넣습니다.
4. **Sign in with Apple** 에 체크한 뒤 **Configure** 를 클릭합니다.
5. **Primary App ID** 에서 2단계의 **App ID** 를 선택하고 **Save** 합니다.
6. **Continue** → **Register** 합니다.
7. **.p8 키 파일**이 한 번만 다운로드됩니다. **반드시 안전한 곳에 보관**합니다. (다시 받을 수 없음.)
8. 화면에 나오는 **Key ID** 를 **복사**해 둡니다. (나중에 Supabase에 넣습니다.)

**여기까지 완료했으면 다음 단계로.**

---

## 6단계: Team ID, Bundle ID 확인

1. **Team ID**: Apple Developer 페이지 **오른쪽 상단** 계정/팀 이름 근처에 10자리 영숫자로 보입니다. 또는 **Membership details** 에서 확인합니다. **복사**해 둡니다.
2. **Bundle ID (App ID)**: 2단계에서 정한 App ID (예: `com.mytripfy.app`) 를 그대로 적어 둡니다. Supabase **Apple Bundle ID** 란에 넣을 값입니다.

**여기까지 완료했으면 다음 단계로.**

---

## 7단계: Apple Client Secret 생성

Supabase는 **Apple이 요구하는 형식의 client secret(JWT)** 이 필요합니다. 이 secret은 **.p8 파일 + Key ID + Team ID + Services ID** 등으로 만듭니다.

1. Supabase 문서의 **Apple client secret 생성 도구** 를 엽니다.  
   [Supabase – Generate Apple client secret](https://supabase.com/docs/guides/auth/social-login/auth-apple#configuration-web-oauth) 안내에 있는 **도구** 링크를 사용하거나,  
   또는 [jwt.io](https://jwt.io/) 등으로 직접 JWT를 만들 수 있습니다. (Supabase 블로그/도구에서 제공하는 생성기 사용을 권장.)
2. 도구에 다음을 입력합니다.  
   - **.p8 파일 내용** (5단계에서 받은 파일을 텍스트 에디터로 열어 전체 복사)  
   - **Key ID** (5단계에서 복사한 값)  
   - **Team ID** (6단계에서 복사한 값)  
   - **Services ID** (3단계 Identifier, 예: `com.mytripfy.web`)  
   - **Apple Bundle ID** (2단계 App ID, 예: `com.mytripfy.app`)
3. 생성된 **secret 문자열(JWT)** 을 **복사**해 둡니다. (Supabase **Secret** 란에 넣을 값입니다.)

**참고:** 이 secret은 **최대 6개월** 유효합니다. 6개월마다 같은 방식으로 새로 만들어 Supabase에 다시 넣어야 합니다.

**여기까지 완료했으면 다음 단계로.**

---

## 8단계: Supabase에 Apple Provider 설정

1. [Supabase 대시보드](https://supabase.com/dashboard) → 사용 중인 **프로젝트** 선택.
2. 왼쪽 **Authentication** → **Providers** 로 이동합니다.
3. **Apple** 을 찾아 **Enable** 을 켭니다.
4. 다음 값을 입력합니다.  
   - **Services ID (Client ID)**  
     → 3단계에서 정한 Identifier (예: `com.mytripfy.web`)  
   - **Secret**  
     → 7단계에서 생성한 **client secret(JWT)**  
   - (Supabase UI에 필드가 있으면) **Key ID**, **Team ID**, **Apple Bundle ID**  
     → 5단계 Key ID, 6단계 Team ID, 2단계 App ID(Bundle ID)
5. **Save** 를 클릭합니다.

**여기까지 완료했으면 다음 단계로.**

---

## 9단계: Redirect URL 확인

1. Supabase **Authentication** → **URL Configuration** (또는 **Redirect URLs**) 로 이동합니다.
2. **Redirect URLs** 목록에 `https://mytripfy.com/**` (또는 사용 중인 사이트 도메인) 이 포함돼 있는지 확인합니다. 없으면 추가 후 저장합니다.

**여기까지 완료했으면 다음 단계로.**

---

## 10단계: 사이트에서 테스트

1. 사이트 **로그인 페이지** (예: `https://mytripfy.com/ko/login`) 로 갑니다.
2. **Continue with Apple** 버튼을 클릭합니다.
3. Apple 로그인/동의 화면이 나온 뒤, 완료하면 다시 사이트로 돌아와 **로그인된 상태**로 보이면 성공입니다.

---

## 요약 체크리스트

| 순서 | 할 일 | 완료 |
|------|--------|------|
| 1 | Apple Developer 접속 | ☐ |
| 2 | App ID 확인/생성 + Sign in with Apple 체크 | ☐ |
| 3 | Services ID 생성 | ☐ |
| 4 | Services ID 에서 Domains·Return URLs 설정 | ☐ |
| 5 | Key 생성, .p8 다운로드·보관, Key ID 복사 | ☐ |
| 6 | Team ID, Bundle ID 확인 | ☐ |
| 7 | Apple client secret(JWT) 생성 | ☐ |
| 8 | Supabase Apple Provider 에 값 입력·저장 | ☐ |
| 9 | Redirect URL 확인 | ☐ |
| 10 | 로그인 페이지에서 Continue with Apple 테스트 | ☐ |

---

## 참고

- Apple 시크릿은 **6개월마다 재발급** 필요. .p8 파일은 안전하게 보관하고, 6개월마다 새 secret 생성 후 Supabase에 다시 입력.
- [Supabase – Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)  
- [Apple – Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
