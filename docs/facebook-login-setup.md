# 페이스북 로그인 설정 (단계별)

로그인 화면의 **Continue with Facebook**을 사용하려면 **Meta(Facebook) 앱 설정**과 **Supabase Facebook Provider 설정**을 순서대로 진행하면 됩니다.

---

## 사전 확인

- **Supabase 프로젝트 URL**  
  Supabase 대시보드 → **Project Settings** → **API** → **Project URL**  
  예: `https://xxxxx.supabase.co`  
  → 콜백 주소는 `https://xxxxx.supabase.co/auth/v1/callback` 입니다.
- **사이트 주소**  
  예: `https://mytripfy.com` (실서비스), `http://localhost:3000` (로컬 테스트 시 필요하면 추가)

---

## 1단계: Meta(Facebook) 개발자 앱 만들기

1. [Facebook for Developers](https://developers.facebook.com/) 에 로그인합니다.
2. 오른쪽 상단 **내 앱** → **앱 만들기**를 클릭합니다.
3. **앱 유형** 선택  
   - **소비자(Consumer)** 또는 **비즈니스(Business)** 등 사용 목적에 맞게 선택합니다.  
   - “소비자”면 일반 로그인용으로 충분합니다.
4. **앱 이름**, **앱 연락처 이메일** 입력 후 **앱 만들기**를 누릅니다.
5. 만들어진 앱 대시보드로 들어갑니다.

---

## 2단계: Facebook 로그인 제품 추가 (단계별로 따라 하기)

앱을 만든 직후에는 “Facebook 로그인”이 연결되어 있지 않을 수 있습니다. **아래 순서대로 한 단계씩** 진행하세요. 화면이 다르면 **방법 2** 또는 **방법 3**으로 넘어가면 됩니다.

---

### 방법 1: 대시보드 본문(가운데)에서 제품 추가 (가장 흔함)

| 단계 | 할 일 | 확인 |
|------|--------|------|
| **1** | [developers.facebook.com/apps](https://developers.facebook.com/apps) 에 접속해 **사용할 앱**을 클릭해 엽니다. | 앱 대시보드가 열립니다. |
| **2** | 왼쪽 메뉴에서 **앱 이름**(맨 위) 또는 **대시보드(Dashboard)** 를 클릭해 **앱 홈 화면**으로 갑니다. | 가운데 넓은 본문 영역이 보입니다. |
| **3** | 본문(가운데 영역)을 **마우스로 아래로 스크롤**합니다. | 위쪽에 있던 요약/차트 아래로 더 내려갑니다. |
| **4** | **“제품을 추가하세요”** / **“Add Products to Your App”** / **“앱에 제품 추가”** 같은 **제목**이 있는 섹션을 찾습니다. | 제목 아래에 여러 **제품 카드**(타일 형태)가 보입니다. |
| **5** | 그 카드들 중 **“Facebook 로그인”** / **“Facebook Login”** 카드를 찾습니다. (아이콘 + “Facebook 계정으로 로그인” 같은 설명) | 카드가 보이면 다음 단계로. |
| **6** | 그 카드 **안쪽**에 있는 **“설정”** / **“Set up”** 버튼을 **클릭**합니다. | 새 화면으로 넘어가거나, 왼쪽 메뉴에 **Facebook 로그인**이 생깁니다. |
| **7** | 왼쪽 메뉴에 **Facebook 로그인**이 생겼다면 → **Facebook 로그인**을 클릭한 뒤 **설정(Settings)** 을 클릭합니다. | **유효한 OAuth 리디렉션 URI** 입력란이 있는 페이지가 나오면 **2단계 완료** → **3단계**로 진행합니다. |

---

### 방법 2: 왼쪽 메뉴 “사용 사례(Use Cases)”에서 추가 (새 UI)

| 단계 | 할 일 | 확인 |
|------|--------|------|
| **1** | 앱 대시보드가 열린 상태에서 **왼쪽 세로 메뉴**를 봅니다. | **빌드 / Build** 또는 **앱 빌드** 같은 항목이 있을 수 있습니다. |
| **2** | **사용 사례** / **Use cases** 를 찾아 **클릭**합니다. | “사용 사례” 목록 또는 “사용 사례 추가” 화면이 나옵니다. |
| **3** | **“사용 사례 추가”** / **“Add use case”** 버튼이 있으면 클릭합니다. 없으면 이미 나열된 사용 사례 목록만 보일 수 있습니다. | Facebook 로그인 관련 항목을 찾을 수 있는 화면으로 이동합니다. |
| **4** | **Facebook 로그인(Facebook Login)** 사용 사례를 찾아 **선택**하거나 **추가**합니다. (설명: “Authenticate and request data from users with Facebook Login” 등) | 선택/추가하면 해당 사용 사례가 앱에 연결됩니다. |
| **5** | 왼쪽 메뉴에 **Facebook 로그인**이 생겼는지 확인합니다. **Facebook 로그인** → **설정(Settings)** 을 클릭합니다. | **유효한 OAuth 리디렉션 URI** 입력 페이지가 나오면 **2단계 완료** → **3단계**로 진행합니다. |

---

### 방법 3: 제품 페이지 주소로 직접 들어가서 추가

| 단계 | 할 일 | 확인 |
|------|--------|------|
| **1** | 브라우저 주소창에 입력하거나, 아래 링크를 엽니다.  
 **https://developers.facebook.com/products/facebook-login/** | Facebook 로그인 **제품 소개 페이지**가 열립니다. |
| **2** | 페이지에서 **“설정”** / **“Set up”** / **“앱에 추가”** / **“Get started”** 같은 버튼을 찾아 **클릭**합니다. | 로그인되어 있으면 “앱 선택” 또는 설정 단계로 넘어갑니다. |
| **3** | **사용할 앱**을 선택하라는 메시지가 나오면, 방금 만든 앱을 선택하고 **확인**합니다. | 해당 앱 대시보드로 이동하거나, “Facebook 로그인이 추가되었습니다” 같은 안내가 나올 수 있습니다. |
| **4** | 앱 대시보드로 돌아가서 **왼쪽 메뉴**에 **Facebook 로그인**이 있는지 확인합니다. **Facebook 로그인** → **설정**을 클릭합니다. | **유효한 OAuth 리디렉션 URI** 입력 페이지가 나오면 **2단계 완료** → **3단계**로 진행합니다. |

---

### 2단계 완료 확인

- 왼쪽 메뉴에 **Facebook 로그인**이 보이고, **설정**을 눌렀을 때 **유효한 OAuth 리디렉션 URI** 입력란이 있는 페이지가 보이면 **2단계는 완료**입니다.  
- 다음 **3단계: OAuth 리디렉션 URI 등록**으로 진행하세요.

---

### 그래도 안 보일 때

| 상황 | 할 일 |
|------|--------|
| “제품을 추가하세요” 섹션이 안 보임 | 본문을 **끝까지** 스크롤해 보세요. 또는 **방법 2**(Use cases)를 시도하세요. |
| Use cases도 없음 | **방법 3**으로 제품 페이지 주소를 직접 열어서 **설정 / Set up**을 눌러 보세요. |
| 앱 만들 때 “Facebook 로그인”을 이미 선택함 | 왼쪽에 **Facebook 로그인**이 있을 수 있습니다. **Facebook 로그인** → **설정**만 클릭해 **3단계**로 가면 됩니다. |

---

## Settings 화면에 들어온 이후 (3단계 ~ 끝까지 자세히)

방법 2로 **Facebook 로그인 → 설정(Settings)** 까지 들어왔다면, 지금 보이는 페이지에서 아래 순서대로 진행하면 됩니다.

### 3단계: OAuth 리디렉션 URI 등록 (Meta 쪽)

**지금 보고 있는 Facebook 로그인 설정 페이지**에서 진행합니다.

| 단계 | 할 일 | 참고 |
|------|--------|------|
| **3-1** | 화면에서 **"유효한 OAuth 리디렉션 URI"** / **"Valid OAuth Redirect URIs"** 입력란을 찾습니다. | 보통 **Client OAuth Settings** 또는 **Facebook Login 설정** 섹션 안에 있습니다. |
| **3-2** | Supabase 콜백 URL을 **한 줄에 하나** 입력합니다. 형식: `https://<본인_Supabase_Project_URL>/auth/v1/callback` 예: `https://kvvsttqlpablawsjgjiv.supabase.co/auth/v1/callback` (Supabase 대시보드 → **Project Settings** → **API** → **Project URL** 에서 확인한 뒤 끝에 `/auth/v1/callback` 를 붙입니다.) | 주소 앞뒤 공백 없이, `https://` 부터 끝까지 정확히 입력합니다. |
| **3-3** | **저장** / **Save changes** / **변경 사항 저장** 버튼을 클릭합니다. | 저장되지 않으면 로그인 시 리디렉트 오류가 납니다. |

**완료:** Meta가 "로그인 후 이 주소로 돌려보내도 된다"고 인식한 상태입니다.

### 4단계: 앱 ID·앱 시크릿 복사 (Supabase에 넣을 값)

| 단계 | 할 일 | 참고 |
|------|--------|------|
| **4-1** | **왼쪽 메뉴**에서 **설정(Settings)** → **기본(Basic)** 을 클릭합니다. | Facebook 로그인 설정이 아니라 **앱 전체 설정** 메뉴입니다. |
| **4-2** | **앱 ID(App ID)** 를 **복사**해서 메모장 등에 붙여 넣어 둡니다. | 나중에 Supabase **Client ID** 란에 넣습니다. |
| **4-3** | **앱 시크릿(App Secret)** 항목에서 **표시(Show)** 를 눌러 값을 **복사**해 둡니다. | 나중에 Supabase **Client Secret** 란에 넣습니다. 꼭 복사해 두세요. |

### 5단계: Supabase에 Facebook Provider 설정

| 단계 | 할 일 | 참고 |
|------|--------|------|
| **5-1** | [Supabase 대시보드](https://supabase.com/dashboard) → **사용 중인 프로젝트** 선택 | mytripfy용 프로젝트 |
| **5-2** | 왼쪽 **Authentication** → **Providers** 클릭 | |
| **5-3** | **Facebook** 의 **Enable** 스위치를 **ON** | |
| **5-4** | **Client ID** 란에 4단계에서 복사한 **앱 ID** 붙여 넣기 | 공백 없이 |
| **5-5** | **Client Secret** 란에 4단계에서 복사한 **앱 시크릿** 붙여 넣기 | 공백 없이 |
| **5-6** | **Save** 클릭 | |

### 6단계: 앱 모드 확인

- **앱 모드**는 **개발(Development)** 로 두면 됩니다. (상단 또는 설정 → 기본에서 확인)
- 개발 모드에서는 **앱 역할**(개발자/테스터)인 페이스북 계정으로만 로그인 가능 → 본인 계정으로 테스트 가능.

### 7단계: 사이트에서 로그인 테스트

| 단계 | 할 일 |
|------|--------|
| **7-1** | 로그인 페이지 접속 (Chrome·Safari 등 일반 브라우저에서, 인앱 브라우저 X) |
| **7-2** | **Continue with Facebook** 클릭 → Facebook 로그인/승인 → 사이트로 돌아오는지 확인 |
| **7-3** | 로그인된 상태로 보이면 성공. 리디렉트 오류 시: Supabase **Redirect URLs** 와 Meta **유효한 OAuth 리디렉션 URI** 가 정확히 맞는지 확인 |

---

## 3단계: OAuth 리디렉션 URI 등록 (요약)

1. **유효한 OAuth 리디렉션 URI** 항목에 아래 주소를 **한 줄에 하나씩** 추가합니다.  
   - Supabase 콜백 (필수):  
     `https://<여기에_본인_ Supabase_Project_URL>/auth/v1/callback`  
     예: `https://kvvsttqlpablawsjgjiv.supabase.co/auth/v1/callback`
2. **변경 사항 저장**을 클릭합니다.  
   → 이 URI가 없으면 Supabase가 페이스북 로그인 후 받는 인증 코드를 처리할 수 없어 로그인이 실패합니다.

---

## 4단계: 앱 ID·앱 시크릿 확인

1. 왼쪽 메뉴 **설정** → **기본**으로 이동합니다.
2. **앱 ID**를 복사해 둡니다.
3. **앱 시크릿** 옆 **표시**를 눌러 값을 확인한 뒤 복사해 둡니다.  
   → 나중에 Supabase에 넣을 때 정확히 입력해야 합니다.

#### Namespace 란? 뭘 넣으면 되나요?

**Namespace**는 Meta 앱을 구분하는 **고유 문자열**입니다. (예전에는 앱 캔버스 주소 `https://apps.facebook.com/여기/` 에 쓰였고, 지금도 기본 설정에서 넣는 경우가 있습니다.)

- **규칙:** **소문자 영문, 숫자, 하이픈(-)** 만 사용. **길이:** 최소 7자, 최대 20자. 전 세계에서 유일해야 해서 이미 쓰인 이름은 사용할 수 없습니다.
- **mytripfy 앱이라면 예시:** `mytripfy` (7자), `mytripfy-web`, `mytripfy-login`, `mytripfy-travel` 처럼 **서비스명-용도** 조합을 추천. 이미 사용 중이면 다른 접미사를 붙여 보세요.
- 저장 후 Meta가 검토할 수 있으며 승인까지 최대 24시간 걸릴 수 있습니다. Facebook 로그인만 쓰는 웹이라면 Namespace가 필수로 안 나올 수도 있고, 나와도 위 규칙대로만 넣으면 됩니다.

#### User data deletion – Data deletion instructions URL vs callback URL

Meta는 앱이 사용자 데이터를 삭제할 수 있도록 **둘 중 하나**를 제공하라고 합니다.

| 항목 | 의미 | 추천 |
|------|--------|------|
| **Data deletion instructions URL** | 사용자에게 **“데이터 삭제를 어떻게 요청하는지”** 설명하는 **웹 페이지** 주소. (예: 개인정보처리방침, 계정 삭제 방법, 연락처) | **이걸 선택하는 것을 추천.** 구현이 쉽고, 이미 개인정보처리방침 페이지가 있으면 그 URL만 넣으면 됨. |
| **Data deletion callback URL** | 사용자가 Facebook 설정에서 “앱 데이터 삭제 요청”을 누르면 **Meta가 POST 요청을 보내는 API 주소**. 서버에서 signed request를 파싱해 해당 사용자 데이터를 삭제하고, `{ url, confirmation_code }` JSON을 반환해야 함. | 자동화된 삭제를 원할 때만 구현. 백엔드 개발 필요. |

**mytripfy처럼 웹만 쓰는 경우:**

1. **Data deletion instructions URL** 을 선택합니다.
2. **URL**에는 **개인정보처리방침 페이지**를 넣습니다.  
   - 예: `https://mytripfy.com/privacy`  
   - (또는 `https://mytripfy.com/ko/privacy` 등 로케일 포함 URL. Meta는 보통 하나의 대표 URL만 요구하므로 `https://mytripfy.com/privacy` 로 두면 됨.)
3. 해당 페이지에 **“계정·개인정보 삭제 요청 방법”**이 있으면 충분합니다.  
   - 이미 “계정 및 개인정보 삭제 요청”, “support@mytripfy.com으로 문의” 등이 적혀 있으므로 그대로 사용 가능.

**Data deletion callback URL** 을 쓰려면:  
- HTTPS API 엔드포인트를 만들고, Meta가 보내는 `signed_request`를 앱 시크릿으로 검증한 뒤, 해당 Facebook 사용자 ID에 매핑된 계정/데이터를 삭제(또는 삭제 예약)하고, `{ "url": "상태 확인 URL", "confirmation_code": "영숫자 코드" }` 를 JSON으로 반환해야 합니다. 필요하면 별도로 구현하면 됩니다.

---

## 5단계: Supabase에 Facebook Provider 설정

1. [Supabase 대시보드](https://supabase.com/dashboard)에서 **해당 프로젝트**를 선택합니다.
2. 왼쪽 **Authentication** → **Providers**로 이동합니다.
3. 목록에서 **Facebook**을 찾아 **Enable**을 켭니다.
4. 다음 값을 입력합니다.  
   - **Client ID (또는 App ID)**  
     → 4단계에서 복사한 **앱 ID**  
   - **Client Secret (또는 App Secret)**  
     → 4단계에서 복사한 **앱 시크릿**
5. **Save**를 눌러 저장합니다.

---

## 6단계: 앱 모드(개발 ↔ 라이브)

- **개발 모드**  
  - 기본값입니다.  
  - **앱 역할**이 “개발자/테스터/관리자”인 페이스북 계정으로만 로그인할 수 있습니다.  
  - 본인·팀 계정으로 먼저 테스트할 때 사용합니다.
- **라이브 모드**  
  - **앱 검수**를 통과한 뒤, 앱 대시보드 **설정** → **기본**에서 **앱 모드**를 **라이브**로 바꿉니다.  
  - 그러면 모든 사용자가 페이스북으로 로그인할 수 있습니다.

---

## 참고: "App customization and requirements" / "Review and complete testing requirements"

대시보드에 **App customization and requirements**(앱 맞춤 설정 및 요건) 섹션이 보이고, 그 안에 **Review and complete testing requirements**(테스트 요건 검토 및 완료)가 **체크되어 있는** 경우를 설명합니다.

### 이게 뭔가요?

- **App customization and requirements**  
  앱을 **라이브로 전환하거나 앱 검수(App Review)를 제출하기 전에** 해야 할 항목들을 모아 둔 영역입니다.
- **Review and complete testing requirements**  
  “요청한 권한·기능에 대해 **테스트 요건을 검토하고 완료하라**”는 뜻입니다.  
  Meta는 제출 전에 각 권한별로 **실제로 API를 호출해 보는 것**, 필요 시 **화면 녹화** 등을 요구할 수 있습니다.

### 체크가 되어 있으면?

- **체크 표시가 “완료”를 의미하는 UI**라면  
  → “테스트 요건 검토·완료”를 이미 했다고 Meta가 인식한 상태일 수 있습니다.  
  → **Facebook 로그인만** 쓰고, 추가 권한을 안 쓴다면 그대로 두고 개발 모드에서 로그인 테스트를 이어가면 됩니다.
- **체크가 “필수 항목” 표시**라면  
  → “이 항목을 완료해야 한다”는 의미일 수 있습니다.  
  → 해당 줄을 클릭해 보면 **테스트 요건**이 뭔지(예: 권한별 1회 이상 API 호출, 테스트 사용자로 로그인 시연 등) 안내가 나옵니다.

### Facebook 로그인만 쓸 때

- **기본 권한**(`public_profile`, `email`)만 쓰는 **Facebook 로그인**은 보통 **개발 모드**에서 별도 검수 없이 테스트할 수 있습니다.
- **개발 모드**에서는 앱 역할(개발자/테스터)인 계정으로만 로그인이 되므로, 그 계정으로 사이트에서 “Continue with Facebook”을 눌러 한 번 로그인해 보면 “테스트 완료”에 해당하는 동작을 한 것입니다.
- **라이브**로 바꿔서 **모든 사용자**에게 열려고 할 때만, 필요하면 **App Review**를 제출하고, 그때 “Review and complete testing requirements”를 본격적으로 맞추면 됩니다.

### 정리

- **지금은 개발 모드로 Facebook 로그인만 테스트**하는 단계라면:  
  → OAuth URI·Supabase 설정까지 끝냈는지 확인한 뒤, 본인(또는 테스터) 계정으로 로그인을 한두 번 해 보면 됩니다.  
  → “Review and complete testing requirements” 체크는 **완료 표시**로 이해하고, 추가로 할 일이 없다고 나오면 그대로 진행해도 됩니다.
- **나중에 라이브 전환·앱 검수**를 할 때:  
  → 대시보드 **App Review** 또는 **Release** 섹션에서 요구하는 테스트·녹화 등을 그때 맞추면 됩니다.

**지금은 개발 모드로 두고**, “Continue with Facebook”이 동작하는지 먼저 확인한 뒤, 필요할 때 검수·라이브 전환을 진행하면 됩니다.

---

## 7단계: (선택) 앱 검수·비즈니스 인증

- **일반 로그인만** 사용할 때는 많은 경우 **개발/테스터 역할**만으로 충분합니다.  
  (역할 추가: **앱 역할** → **역할**에서 테스터 추가)
- **모든 사용자**에게 페이스북 로그인을 열려면:
  1. Meta 쪽에서 요구하는 **앱 검수**(필요한 권한에 따라)를 진행하고,
  2. **앱 모드**를 **라이브**로 전환합니다.
- **비즈니스 인증**은 Meta가 “비즈니스 사용”을 요구할 때만 진행하면 됩니다.  
  (이전 대화에서 Security and Login, 2FA, 사업 유형 등 설정하신 내용이 여기에 해당합니다.)

---

## 8단계: 사이트에서 동작 확인

1. **로컬**  
   - `npm run dev` 등으로 실행한 뒤  
   - 로그인 페이지에서 **Continue with Facebook** 클릭  
   - 페이스북 로그인 후 `NEXT_PUBLIC_SITE_URL`(또는 사용 중인 origin)으로 리디렉트되는지 확인합니다.
2. **실서버(Vercel 등)**  
   - 배포 후 `https://mytripfy.com`(또는 사용 도메인)에서 동일하게 테스트합니다.
3. **리디렉트 오류**가 나오면  
   - Supabase **Authentication** → **URL Configuration**에서  
     **Redirect URLs**에 `https://mytripfy.com/**`, `http://localhost:3000/**` 등이 포함돼 있는지 확인합니다.

---

## 요약 체크리스트

| 순서 | 할 일 | 완료 |
|------|--------|------|
| 1 | Meta 개발자에서 앱 생성 | ☐ |
| 2 | 제품에 “Facebook 로그인” 추가 | ☐ |
| 3 | 유효한 OAuth 리디렉션 URI에 Supabase 콜백 URL 추가 | ☐ |
| 4 | 앱 ID·앱 시크릿 복사 | ☐ |
| 5 | Supabase Authentication → Providers → Facebook 켜고 ID/시크릿 입력 | ☐ |
| 6 | 개발 모드로 본인 계정 로그인 테스트 | ☐ |
| 7 | (필요 시) 앱 검수 후 라이브 전환 | ☐ |

---

## "Submit for Login Review" 메시지가 나올 때

로그인은 되는데 Meta 대시보드나 로그인 흐름에서 아래 메시지가 보이는 경우:

```
Submit for Login Review
Some of the permissions below have not been approved for use by Facebook.
Submit for review now or learn more
```

### 이게 뭔가요?

- **개발 모드(Development)** 에서는 **앱 역할**(개발자·테스터·관리자)인 계정만 로그인할 수 있습니다.
- Meta는 “아직 Facebook 쪽에서 승인되지 않은 권한이 있다”고 안내하는 문구를 보여 줍니다.
- **public_profile** 과 **email** 만 쓰는 경우, 개발·테스트에는 **검수 제출 없이** 사용할 수 있고, 로그인도 정상 동작합니다.

### 지금 할 일

| 상황 | 할 일 |
|------|--------|
| **지금은 본인·테스터만 로그인 테스트하는 중** | **무시해도 됩니다.** “Submit for review now”를 누르지 않아도 로그인은 계속 동작합니다. 개발 모드로 두고 테스트만 이어가면 됩니다. |
| **모든 사용자**에게 페이스북 로그인을 열어 두고 싶을 때 | 그때 **Submit for Login Review** (또는 **앱 검수 / App Review**)를 제출합니다. `public_profile`, `email` 만 쓰면 검수가 비교적 단순한 편입니다. 검수 통과 후 **앱 모드**를 **라이브(Live)** 로 바꾸면 됩니다. |

### 정리

- **로그인이 되고 있다** → 설정은 맞게 된 것입니다.
- **“Submit for Login Review”** 문구는 “나중에 라이브로 쓸 때 검수를 받으라”는 안내일 뿐이라, **지금 단계에서는 닫아 두거나 무시**해도 됩니다.

---

## Login Review / App Review 제출하기 (단계별)

**public_profile** 과 **email** 만 쓰는 경우 Meta 공식 문서상 **검수 없이** 사용 가능한 권한이지만, 대시보드에서 "Submit for Login Review"를 요구하거나 **Go live** 전에 제출이 필요하다고 나오면 아래 순서대로 진행하면 됩니다.

### 제출 전 준비 (필수)

| 항목 | 할 일 |
|------|--------|
| **앱 아이콘** | **설정(Settings)** → **기본(Basic)** → **앱 아이콘**: 1024×1024 이미지 업로드 (아래 "앱 아이콘이란?" 참고) |
| **개인정보처리방침 URL** | **설정** → **기본** → **개인정보처리방침 URL(Privacy Policy URL)** 에 사이트 개인정보처리방침 주소 입력 (예: `https://mytripfy.com/privacy`) |
| **앱 공개 접근** | 실서버(예: mytripfy.com)에서 로그인 페이지가 **누구나 접속 가능**한지 확인. 또는 검수 담당자가 접속할 수 있도록 **접속 방법 설명** 준비 |
| **권한별 API 호출** | 제출 **30일 이내**에, 요청할 **각 권한**마다 **1회 이상** 성공한 API 호출이 있어야 함. 사이트에서 "Continue with Facebook"으로 로그인해 보면 `public_profile`, `email` 사용에 해당하는 호출이 기록됨 |
| **플랫폼 약관·정책** | [Meta Platform Terms](https://developers.facebook.com/terms), [Developer Policies](https://developers.facebook.com/devpolicy) 읽고 앱이 정책에 맞는지 확인 |

#### 앱 아이콘이란? 어떤 이미지를 쓰면 되나요?

**앱 아이콘**은 Meta 개발자 대시보드와, 사용자가 "Facebook으로 로그인" 할 때 **어떤 앱이 권한을 요청하는지** 보여 주는 **앱을 대표하는 이미지**입니다.

- **준비할 이미지**
  - **사이트/서비스 로고**를 쓰면 됩니다. 예: **mytripfy** 로고(이미지 또는 텍스트 로고).
  - 별도 로고가 없으면, 서비스 이름을 넣은 **간단한 아이콘**(예: 여행·지도 관련 그림 + "mytripfy" 텍스트)을 1024×1024로 만들어도 됩니다.
- **규격**
  - **크기:** **1024×1024 픽셀** (정사각형).
  - **형식:** PNG 또는 JPG. 투명 배경이 필요하면 PNG.
- **주의**
  - **Facebook/Meta 로고·상표**는 넣으면 안 됩니다. (Meta 가이드라인 위반)
  - 너무 작은 글자나 디테일은 1024에서도 잘 안 보일 수 있으니, **단순하고 알아보기 쉬운** 디자인이 좋습니다.

**정리:** mytripfy 사이트에 쓰는 **로고 이미지**를 **1024×1024**로 리사이즈해서 업로드하면 됩니다. 이미 로고가 있다면 그걸 정사각형으로 자르거나 여백을 두고 1024×1024 캔버스에 넣어서 저장하면 됩니다.

### 1단계: 검수/제출 화면으로 이동

- **방법 A:** 대시보드 왼쪽 메뉴 **제출(Submit)** 또는 **앱 검수(App Review)** → **권한 및 기능(Permissions and Features)** 탭으로 이동.
- **방법 B:** **Publish(게시)** → **Go live** 로 들어가서, "Submit for review" / "제출" 관련 버튼이나 링크를 클릭해 제출 플로우로 들어갑니다.
- **방법 C:** "Submit for Login Review" 메시지 안의 **Submit for review now** / **Learn more** 링크를 클릭해 제출 페이지로 이동.

### 2단계: 권한·기능 선택

- **App Review** > **Permissions and Features** (또는 동일한 의미의 탭)에서, 앱이 사용하는 **권한**을 찾습니다.
- **public_profile**, **email** 만 쓰는 경우 이 두 권한만 요청합니다.
- 각 권한 옆 **Request advanced access** / **고급 액세스 요청** 버튼이 있으면 클릭해 제출 목록에 넣습니다. (이미 "검수 불필요"로 표시된 권한은 버튼이 비활성화되어 있을 수 있음.)
- **Continue** / **다음** 을 눌러 다음 단계로 진행합니다.

### 3단계: 비즈니스 인증(요구 시)

- 화면에서 **Business Verification(비즈니스 인증)** 을 요구하면, 안내에 따라 진행합니다.
- **public_profile**, **email** 만 요청하는 경우에는 비즈니스 인증이 필요 없을 수 있습니다.

### 4단계: 앱 설정 완료

- **Complete App Settings** / **앱 설정 완료** 섹션에서 다음을 확인·입력합니다.
  - **앱 아이콘**: 1024×1024, Meta 상표·로고 미포함
  - **개인정보처리방침 URL**: 위에서 입력한 URL
  - **앱 목적(App Purpose)**: 본인/자사 서비스만 쓰면 "Yourself or your own business", 제3자 서비스면 "Clients"
  - **앱 카테고리**: 앱에 맞는 카테고리 선택
  - **주 연락처 이메일**: 검수 관련 연락이 갈 이메일 (접근 가능한 주소로)

### 5단계: 앱 검증(접근 방법 안내)

- **Complete App Verification** / **앱 검증 완료** 섹션을 엽니다.
- "앱 사용자가 Meta 인증(페이스북 로그인 등)으로 로그인할 수 있나요?" → **예(Yes)** 선택.
- **검수 담당자가 앱에 접속하는 방법**을 적습니다. 예:  
  "Go to https://mytripfy.com (or https://mytripfy.com/ko/login), click 'Continue with Facebook' and sign in with a test Facebook account. After login, the user is redirected to the home page."

### 6단계: 권한별 사용 설명 + 화면 녹화

- **Requested Permissions and Features** / **요청한 권한 및 기능** 에서 **각 권한마다** 다음을 작성·첨부합니다.
  - **왜 이 권한이 필요한지** 짧은 설명 (영어 권장).  
    예: email – "We use the user's email to create and identify their account and to send important account-related notifications."
  - **화면 녹화**: 해당 권한을 **사용자가 허용하는 과정**과 **앱에서 그 데이터를 쓰는 화면**이 보이도록 녹화 (해상도 1080p 이상, 가능하면 영어 UI 또는 자막·설명 추가).  
    - **public_profile / email**: "Continue with Facebook" 클릭 → 페이스북 로그인/권한 허용 → 사이트로 복귀 → 로그인된 프로필·이메일 표시되는 화면까지 보여 주면 됩니다.
- 권한이 여러 개면 **각각** 설명과 녹화를 넣습니다. 복사·붙여넣기 대신 **권한마다 다른 이유**를 적는 것이 좋습니다.

### 7단계: 제출

- 모든 필수 항목을 채운 뒤 **Submit for Review** / **검수 제출** 버튼을 클릭합니다.
- 표시되는 **Platform Onboarding Terms** 등 약관에 동의하고 제출을 완료합니다.
- 제출 후 **결정(승인/거부)** 은 보통 **며칠 내 ~ 1주일** 안에 이메일 또는 대시보드에 표시됩니다.

### 제출 후: Go live

- **승인**되면 대시보드 **Publish(게시)** → **Go live** 로 이동해 **Go live** 버튼을 클릭해 앱을 **라이브**로 전환합니다.
- **public_profile**, **email** 만 쓰는 경우, 일부 앱은 "검수 없이" **Publish > Go live** 만으로 라이브 전환이 가능할 수 있습니다. Go live가 비활성화되어 있거나 "제출 필요"라고 나오면 위 1~7단계 제출을 먼저 완료한 뒤 다시 **Go live** 를 시도하면 됩니다.

---

## 오류 해결: "Invalid Scopes: email"

로그인 클릭 시 아래 메시지가 나오는 경우:

```
This content isn't available right now
Invalid Scopes: email. This message is only shown to developers.
```

**원인:** Meta 앱의 **Facebook 로그인 사용 사례**에서 **email** 권한이 “사용 가능한 권한”으로 **추가되지 않은 상태**에서, Supabase가 `email` scope를 요청해 Facebook이 거부한 것입니다.

**해결: Meta 대시보드에서 email 권한 추가**

| 단계 | 할 일 |
|------|--------|
| 1 | Meta 앱 대시보드에서 왼쪽 메뉴 **사용 사례(Use cases)** → **Facebook 로그인(Facebook Login)** 으로 들어갑니다. (또는 **인증 및 계정 생성 / Authentication and Account Creation** 등으로 표시될 수 있음) |
| 2 | **권한 및 기능(Permissions and features)** / **Permissions and features** 섹션을 찾습니다. |
| 3 | **추가(Add)** 또는 **권한 추가**를 클릭해 **email** 권한을 목록에 추가합니다. (이미 있으면 **편집**으로 상태 확인) |
| 4 | **public_profile** 과 **email** 이 둘 다 목록에 있고, 상태가 **Ready for testing** / **테스트 준비 완료** 인지 확인합니다. |
| 5 | **저장** 후 다시 사이트에서 **Continue with Facebook** 으로 로그인을 시도합니다. |

**참고**

- `public_profile` 과 `email` 은 앱 검수(App Review) 없이 **개발 모드**에서 사용할 수 있는 기본 권한입니다.
- “Facebook Login for Business” 가 아니라 **일반 Facebook 로그인** 사용 사례에서 위 권한을 추가해야 합니다.

---

**참고**

- 기존 문서: `docs/social-login-apple-facebook.md` (Apple·Facebook·환경 변수 요약)
- Supabase Facebook 로그인 공식 문서:  
  [Supabase – Facebook Auth](https://supabase.com/docs/guides/auth/social-login/auth-facebook)
- Facebook 로그인 권한:  
  [Permissions – Facebook Login](https://developers.facebook.com/docs/facebook-login/permissions)
