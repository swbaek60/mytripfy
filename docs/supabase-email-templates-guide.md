# Supabase 회원가입 확인 이메일 템플릿 적용 가이드

회원가입 시 발송되는 **Confirm signup** 이메일을 mytripfy 브랜드에 맞게 적용하는 방법입니다.

## 1. Supabase에서 설정할 위치

- **Supabase Dashboard** → **Authentication** → **Email Templates**
- **Confirm signup** 탭 선택

## 2. 제목 (Subject)

아래 문구를 **Subject** 입력란에 넣습니다. (글로벌 회원용 영어)

```
Complete your mytripfy signup
```

## 3. 본문 (Body)

- `docs/supabase-email-confirm-signup-template.html` 파일을 엽니다.
- 파일 안에 **"Body (본문) – 여기부터 복사"** 와 **"Body 끝"** 사이의 **HTML 전체**를 복사합니다.
- Supabase **Confirm signup**의 **Body** 영역에 붙여넣습니다.
- **저장** 버튼을 눌러 저장합니다.

## 4. 포함된 내용

- mytripfy 로고 (`https://mytripfy.com/logo.png`)
- "Complete your signup" 제목 (영어)
- 가입 이메일 주소 표시 (`{{ .Email }}`)
- **Confirm your email** 버튼 (클릭 시 `{{ .ConfirmationURL }}`로 이동)
- 버튼이 안 될 때를 위한 수동 링크 안내
- 감사 문구 및 서비스 소개 (영어)
- 푸터 (© mytripfy, Visit 링크)

## 5. 변수 (Supabase가 자동 치환)

| 변수 | 설명 |
|------|------|
| `{{ .ConfirmationURL }}` | 이메일 인증 완료 링크 (반드시 유지) |
| `{{ .SiteURL }}` | 사이트 URL (Authentication → URL Configuration에서 설정) |
| `{{ .Email }}` | 가입한 이메일 주소 |

## 6. 로고 URL 변경

로고를 다른 주소로 쓰려면 HTML 본문에서 아래 부분만 수정하면 됩니다.

```html
<img src="https://mytripfy.com/logo.png" alt="mytripfy" ...
```

원하는 이미지 URL로 `src` 값을 바꿔 주세요.
