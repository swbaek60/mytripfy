# 방법 A(직접 OAuth URL 이동) vs 현재 구현 비교

## 검색에서 알려준 방법 A

- **JavaScript SDK(팝업) 대신** Facebook OAuth **인증 URL을 직접 호출**해서 **현재 창 주소를 바꾼다**.
- URL 형식: `https://www.facebook.com/v.../dialog/oauth?client_id={앱ID}&redirect_uri={리다이렉트URL}&state=...`
- 로그인 후 `redirect_uri`로 돌아올 때 쿼리에 `code`가 오고, **서버에서 code로 토큰 교환**하면 됨.

→ 요지는 **“팝업/새 창 쓰지 말고, 같은 창에서 OAuth URL로 이동”** 하는 방식이다.

---

## 우리가 이미 하고 있는 것

1. **같은 창 이동**
   - 모바일: `<a href="/api/auth/oauth-start?provider=facebook&locale=...">` (링크) → 서버가 **200 + meta refresh**로 Supabase authorize URL로 이동.
   - 데스크톱: form GET → **200 HTML + form (target="_self")** 로 Supabase authorize URL로 이동.
   - 즉, **팝업/새 창 없이 “직접 OAuth URL로 이동”** 하는 것은 이미 하고 있음.

2. **실제로 가는 URL**
   - 우리가 사용하는 건 **Facebook URL이 아니라 Supabase authorize URL** 이다.
   - `https://{프로젝트}.supabase.co/auth/v1/authorize?provider=facebook&redirect_to=우리사이트/auth/callback&...`
   - 이 URL로 이동하면 **Supabase가 그 다음에 Facebook OAuth URL로 302 리다이렉트**한다.
   - 그래서 “같은 창에서 OAuth URL로 이동”이라는 점에서는 방법 A와 **동일한 패턴**이다.  
     (우리 → Supabase URL → (Supabase가) Facebook URL → …)

3. **code 처리**
   - Facebook은 **Supabase에 등록된 redirect_uri**(Supabase 콜백)로 `code`를 보낸다.
   - Supabase가 code로 토큰/세션 처리한 뒤, **우리 사이트** `redirect_to`(예: `/auth/callback?locale=...`)로 리다이렉트한다.
   - 우리 `src/app/auth/callback/route.ts`에서는 **Supabase가 넘겨준 code**로 `exchangeCodeForSession(code)`만 호출하면 됨.  
   → “서버에서 code 처리”는 Supabase가 대신 해 주고, 우리는 그 결과만 받는 구조.

---

## “Facebook URL을 우리가 직접 만든다”는 방식은?

- 방법 A를 **문자 그대로** 적용하면:
  - `redirect_uri`를 **우리 서버**(예: `https://우리도메인/auth/callback`)로 두고,
  - 우리가 `https://www.facebook.com/.../dialog/oauth?client_id=...&redirect_uri=...` 로 이동하게 하는 것이다.
- 그러면:
  - Facebook이 **우리 서버**로 `code`를 보내고,
  - 우리가 **직접** Facebook에 `code` ↔ 액세스 토큰 교환을 구현해야 한다.
  - 지금은 **Supabase Auth**로 로그인/세션을 쓰고 있으므로, 그렇게 하면 **Supabase 세션 생성**까지 우리가 직접 구현해야 해서 변경 폭이 크다.
- 또, Facebook 앱 설정의 “Valid OAuth Redirect URIs”에는 지금 **Supabase 콜백 URL**이 등록되어 있을 가능성이 높다.  
  우리 URL을 직접 쓰려면 Facebook 앱 설정도 바꿔야 하고, Supabase와 이중으로 관리하게 됨.

그래서 **지금 구조를 유지하는 한** “Facebook OAuth URL을 우리가 직접 조합해서 쓰는” 방식은 추천하지 않는다.

---

## 정리

| 항목 | 방법 A (검색) | 현재 구현 |
|------|----------------|-----------|
| 팝업/새 창 사용 | 사용 안 함 (같은 창) | 사용 안 함 (같은 창) |
| 이동 방식 | OAuth URL로 직접 이동 | Supabase authorize URL로 이동 → Supabase가 Facebook으로 리다이렉트 |
| code 수신 주체 | 우리 서버 (직접 구현 시) | Supabase → 우리는 `exchangeCodeForSession` 만 호출 |
| “같은 창에서 OAuth URL로 이동” | ✅ | ✅ (이미 동일 개념) |

- **방법 A의 핵심(직접 URL로 같은 창 이동)** 은 이미 하고 있다.
- 다만 우리는 **Supabase를 쓰기 때문에** “직접 가는 URL”이 **Facebook URL이 아니라 Supabase URL**인 것이 맞고, 이게 더 유지보수하기 좋다.
- 모바일에서 새 창이 뜨는 문제는 “직접 URL 이동”이 아니라,  
  **어느 단계에서 새 창이 열리게 되느냐**(우리 → Supabase, Supabase → Facebook, 또는 Facebook 내부)를 실제 기기에서 확인하는 것이 다음 단계다.

이 비교를 바탕으로, **방법 A를 새로 도입하기보다는** Supabase authorize URL로 같은 창 이동을 유지한다.

**추가 조치 (새 창 URL 기준):** 새 창에 `m.facebook.com/privacy/consent/gdp/` 가 뜨는 경우, 우리 → Supabase 구간에서 meta refresh가 일부 모바일에서 새 탭으로 열리는 것으로 추정되어, **모바일 Facebook은 200+meta refresh 대신 HTTP 302 리다이렉트**만 사용하도록 변경함. (같은 탭 이동 유도)
