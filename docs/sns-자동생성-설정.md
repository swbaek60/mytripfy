# SNS 이미지 — Generate 버튼 없이 자동 생성

## 왜 Generate 버튼이 뜨나요?

Cursor 채팅에서 **GenerateImage** 도구를 쓰면 IDE가 확인 버튼을 띄웁니다.  
**일일 SNS·레퍼런스 사진은 이 버튼을 쓰지 않고**, OpenAI API 스크립트로만 만듭니다.

## 한 번만 설정 (필수)

**방법 A — PowerShell (권장, 키가 .env에 직접 안 남음):**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/prompt-sns-secrets.ps1
```

**방법 B — 파일에 직접 저장:**

`secrets/openai.txt` 에 `sk-...` 한 줄만 넣고:

```bash
npm run sns:setup
```

인스타 자동 게시까지: `secrets/meta-token.txt`, `instagram-sua-id.txt`, `instagram-ethan-id.txt` ([docs/sns-meta-api-setup.md](sns-meta-api-setup.md))

`npm run sns:setup` 이 `.env.local` + `secrets/` → `.env.sns` 를 자동 생성합니다.

## 자동 실행

| 방법 | 설명 |
|------|------|
| **매일 07:00** | Windows 작업 `MyTripfy-SNS-Daily` (이미 등록됨) |
| **수동 테스트** | `npm run sns:auto` |
| **인스타까지** | `.env.sns`에 Meta 토큰 + `SNS_AUTO_PUBLISH=true` |

로그: `scripts/out/sns-auto.log`  
결과: `scripts/out/오늘날짜/` — 캡션 txt + png 8장

## 레퍼런스 사진 다시 만들 때

```bash
npm run sns:refs
```

`assets/sns/sua-ref-*.png`, `ethan-ref-*.png` — **Generate 버튼 불필요**

## 에이전트(채팅) 규칙

이미지 요청 시 채팅 AI는 `GenerateImage` 대신 `npm run sns:auto` 또는 `npm run sns:refs` 를 실행합니다.
