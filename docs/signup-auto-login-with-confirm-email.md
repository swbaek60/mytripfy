# 가입 후 바로 로그인 + 확인 메일 발송 설정 (단계별)

이메일·비밀번호로 가입하면 **바로 로그인**되고, 동시에 **확인 메일**이 발송되도록 하는 설정입니다.

---

## 1단계: Supabase에서 Confirm email 켜기

1. **Supabase Dashboard** 접속  
   → [supabase.com](https://supabase.com) 로그인 후 해당 프로젝트 선택

2. 왼쪽 메뉴에서 **Authentication** → **Providers** 클릭

3. **Email** 항목 클릭

4. **Confirm email** 옵션을 **ON**으로 변경

5. **Save** 클릭

→ 이제 회원가입 시 Supabase가 자동으로 확인 메일을 보냅니다.

---

## 2단계: 환경 변수에 Service Role Key 넣기

매직 링크 생성에 **Service Role Key**가 필요합니다.

1. Supabase Dashboard에서 **Project Settings** (왼쪽 하단 톱니바퀴) → **API** 이동

2. **Project API keys** 섹션에서 **service_role** 키를 찾습니다.  
   - **Reveal** 클릭 후 키 전체를 복사 (anon key가 아님, **service_role** 키)

3. 프로젝트 루트의 **`.env.local`** (로컬) 또는 배포 환경의 **환경 변수**에 아래 한 줄 추가:

   ```env
   SUPABASE_SERVICE_ROLE_KEY=여기에_복사한_service_role_키_붙여넣기
   ```

4. **주의**: 이 키는 **서버에서만** 사용하고, 브라우저나 클라이언트 코드에 노출하면 안 됩니다. (이미 `createAdminClient`는 서버에서만 쓰고 있음)

5. 로컬에서 테스트할 때는 `.env.local` 저장 후 **개발 서버를 다시 실행**합니다.

---

## 3단계: Redirect URL 허용 목록에 콜백 주소 추가

매직 링크 클릭 후 우리 사이트로 돌아오려면, 콜백 URL이 허용 목록에 있어야 합니다.

1. Supabase Dashboard → **Authentication** → **URL Configuration** 이동

2. **Redirect URLs** 섹션에서 **Add URL** 클릭

3. 아래 주소들을 **각각** 추가 (사용하는 것만 넣어도 됨):

   | 환경     | 추가할 URL                              |
   |----------|-----------------------------------------|
   | 로컬     | `http://localhost:3000/auth/callback`   |
   | 프로덕션 | `https://mytripfy.com/auth/callback`    |

   (실제 도메인이 다르면 그에 맞게 수정)

4. **Save** 클릭

---

## 4단계: 확인 메일 내용(템플릿) 적용 (선택)

확인 메일 문구를 우리 서비스에 맞게 바꾸려면:

1. Supabase Dashboard → **Authentication** → **Email Templates** 이동

2. **Confirm signup** 선택

3. **Subject**: `Complete your mytripfy signup` (또는 원하는 제목)

4. **Body**: `docs/supabase-email-confirm-signup-template.html` 파일을 열어,  
   "Body (본문) – 여기부터 복사" ~ "Body 끝" 사이의 **HTML 전체**를 복사해 붙여넣기

5. **Save** 클릭

자세한 내용은 `docs/supabase-email-templates-guide.md` 참고.

---

## 5단계: 동작 확인

1. **로그아웃** 상태에서 로그인 페이지로 이동

2. **회원가입** 탭에서 이메일·비밀번호 입력 후 가입

3. 예상 동작:
   - 곧바로 **홈(또는 해당 locale 홈)** 으로 이동하며 **로그인된 상태**
   - 등록한 이메일 주소로 **확인 메일** 수신
   - 나중에 메일의 "Confirm your email" 링크를 눌러도 동작 (이미 로그인돼 있어도 이메일 인증만 반영됨)

4. **실패 시 확인**:
   - "Check email to continue sign in process"만 나오면 → `SUPABASE_SERVICE_ROLE_KEY`가 없거나 잘못됐거나, Redirect URL이 허용 목록에 없을 수 있음
   - 2단계·3단계를 다시 확인하고, 브라우저 개발자 도구 Network 탭에서 리다이렉트/에러 응답 확인

---

## 요약 체크리스트

| # | 작업 | 완료 |
|---|------|------|
| 1 | Supabase **Confirm email** ON | ☐ |
| 2 | **SUPABASE_SERVICE_ROLE_KEY** 환경 변수 추가 | ☐ |
| 3 | **Redirect URLs**에 `/auth/callback` URL 추가 | ☐ |
| 4 | (선택) Confirm signup 이메일 템플릿 적용 | ☐ |
| 5 | 가입 → 바로 로그인 + 메일 수신 확인 | ☐ |

---

## 참고

- Service Role Key는 **절대** 클라이언트 번들이나 공개 저장소에 올리지 마세요.
- 프로덕션 도메인을 쓰면 **Site URL**과 **Redirect URLs**에 `https://` 도메인을 반드시 넣어야 합니다.
