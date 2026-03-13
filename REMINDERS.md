# 리마인더 (운영 전 체크)

## 웹서비스 오픈 전

- [ ] **AWS SES 프로덕션 전환**  
  실제 사용자에게 이메일을 보내기 시작하기 전에 신청.  
  AWS 콘솔 → SES → **Account dashboard** → **Request production access**

---

## 구글 로그인 시 "mytripfy"로 보이게 하기

**현상:** 구글로그인 클릭 시 "계정을 선택하세요. kvvsttqlpablawsjgjiv.supabase.co(으)로 이동" 처럼 Supabase 도메인이 노출됨.

**이유:** Google이 OAuth 리다이렉트 대상 주소(콜백 URL의 도메인)를 그대로 보여 주기 때문. 현재 콜백이 Supabase 서버로 가서 `xxx.supabase.co`가 표시됨.

---

### 지금 바로: Google에서 앱 이름을 "mytripfy"로

구글 로그인·동의 화면에 **앱 이름**을 mytripfy로 보이게 하려면 아래처럼 설정하면 됩니다.

1. **[Google Cloud Console](https://console.cloud.google.com/)** 접속 후, 사용 중인 프로젝트 선택.

2. 왼쪽 메뉴에서 **API 및 서비스** → **OAuth 동의 화면** 이동.
   - (영문이면 **APIs & Services** → **OAuth consent screen**)

3. **앱 정보** 영역에서:
   - **앱 이름**: **mytripfy** 로 입력 후 저장.
   - (영문: **Application name**)
   - 필요하면 **앱 로고**(**Application logo**)에 mytripfy 로고 이미지 업로드.

4. **저장** 후, 구글 로그인을 다시 시도하면 동의 화면 등에서 앱 이름이 **mytripfy**로 표시됩니다.

---

### "xxx(으)로 이동" 문구 – 언제 바꾸면 되나?

- **꼭 미리 할 필요는 없음.** 지금처럼 `kvvsttqlpablawsjgjiv.supabase.co`로 두어도 로그인은 정상 동작합니다.
- **지금 바꾸고 싶다면** 아래 두 가지 중 하나를 적용하면 됩니다.

---

#### 방법 A: Vanity 서브도메인 (추천 – DNS 없이 가능)

Supabase **Vanity 서브도메인**을 쓰면 `kvvsttqlpablawsjgjiv.supabase.co` 대신 **mytripfy.supabase.co**로 접속되며, 구글 로그인 시 **"mytripfy.supabase.co(으)로 이동"**으로 표시됩니다. (직접 소유한 도메인은 아니지만, 이름이 노출됩니다.)

**주의:** 활성화 후에는 **기존** `https://kvvsttqlpablawsjgjiv.supabase.co` 로는 Auth가 동작하지 않으므로, **반드시** Google 리디렉션 URI를 새 주소로 바꿔야 합니다.

1. **Supabase CLI** 설치 후 로그인  
   - [CLI 설치 가이드](https://supabase.com/docs/guides/local-development/cli/getting-started)

2. **사용 가능 여부 확인** (선택)  
   ```bash
   supabase vanity-subdomains check-availability --project-ref kvvsttqlpablawsjgjiv --desired-subdomain mytripfy --experimental
   ```

3. **Vanity 서브도메인 활성화**  
   ```bash
   supabase vanity-subdomains activate --project-ref kvvsttqlpablawsjgjiv --desired-subdomain mytripfy --experimental
   ```

4. **Google Cloud Console에서 리디렉션 URI 수정**  
   - **API 및 서비스** → **사용자 인증 정보** → OAuth 2.0 클라이언트 ID 클릭  
   - **승인된 리디렉션 URI**에서  
     `https://kvvsttqlpablawsjgjiv.supabase.co/auth/v1/callback`  
     를  
     `https://mytripfy.supabase.co/auth/v1/callback`  
     로 **교체** (또는 새 URI 추가 후 기존 것 제거).  
   - 저장.

5. **Supabase 대시보드**  
   - Authentication → URL Configuration 등에서 안내하는 대로 **Site URL**은 우리 사이트(예: https://mytripfy.com)로 유지.  
   - (콜백 주소는 이제 mytripfy.supabase.co로 쓰이므로 별도 입력은 없을 수 있음.)

6. **로그인 테스트**  
   - 구글로그인 시 "**mytripfy.supabase.co**(으)로 이동"으로 표시되는지 확인.

(Vanity 서브도메인과 커스텀 도메인은 동시에 사용할 수 없습니다. 나중에 완전히 우리 도메인(auth.mytripfy.com)으로 바꾸려면 방법 B를 사용.)

---

#### 방법 B: 완전한 커스텀 도메인 (auth.mytripfy.com)

"**auth.mytripfy.com**(으)로 이동"처럼 **우리 도메인**이 보이게 하려면 Supabase **Custom Domain**을 설정합니다.

1. **Supabase 대시보드**  
   - [Supabase Dashboard](https://supabase.com/dashboard) → 해당 프로젝트 → **설정(Settings)** → **Custom Domains**  
   - 예: `auth.mytripfy.com` 서브도메인을 Supabase에 연결 (안내에 따라 DNS CNAME 설정).  
   - [Management API – Activate custom hostname](https://supabase.com/docs/reference/api/v1-activate-custom-hostname) 참고.

2. **Supabase 인증**  
   - 연결 후 **Authentication** → **URL Configuration**에서 사용하는 주소가 커스텀 도메인 기준으로 바뀜.

3. **Google Cloud Console**  
   - **승인된 리디렉션 URI**에  
     `https://auth.mytripfy.com/auth/v1/callback`  
     추가 후, 기존 Supabase 콜백 URI 제거 또는 유지(문서 참고).

4. 그러면 구글 로그인 시 "**auth.mytripfy.com**(으)로 이동"으로 표시됩니다.
