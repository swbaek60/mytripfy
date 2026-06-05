# SNS 이미지 — 무료·품질 옵션

## Cursor Generate 버튼 vs 자동 스크립트

| 방식 | 자동(매일 8장) | 품질 | 비용 |
|------|----------------|------|------|
| **Cursor GenerateImage** (채팅) | ❌ 버튼 클릭 필요 | ★★★★★ | Cursor 구독 |
| **Gemini Nano Banana** (API) | ✅ | ★★★★☆ | **무료 한도** (AI Studio 키) |
| **Pollinations** | ✅ | ★★☆☆☆ | $0 (대기열 402 자주) |
| **OpenAI DALL·E** | ✅ | ★★★★☆ | 유료 |

**채팅에서 만든 수아·이든 레퍼런스**(`assets/sns/*-ref*.png`)는 그대로 두고,  
**일일 8장**은 Gemini API가 레퍼런스 얼굴을 보고 생성합니다 (Cursor와 비슷한 계열).

---

## 권장: Gemini (나노바나나) — 1단계

### 키 발급 (무료, 카드 없이 가능)

1. [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) 접속
2. Google 로그인 → **Create API key**
3. 프로젝트 `secrets/gemini.txt` 에 키 **한 줄만** 저장 (`AIza...`)

### 설정

```powershell
cd c:\Users\swbae\Documents\mytripfy
npm run sns:setup
```

`.env.sns` 에 자동으로:

```
SNS_IMAGE_PROVIDER=gemini
GEMINI_API_KEY=AIza...
```

### 테스트

```powershell
npm run sns:auto
```

`scripts/out/오늘날짜/sua-1.png` 등 8장 확인.

---

## Pollinations만 쓸 때 (키 없음)

`.env.local` 또는 `.env.sns`:

```
SNS_IMAGE_PROVIDER=pollinations
```

- IP당 **동시 1요청** 제한 → 스크립트가 **15초 간격 + 402 시 재시도**
- 품질·얼굴 일관성이 Gemini보다 떨어짐

---

## 레퍼런스 활용

Gemini 모드에서 `assets/sns/sua-ref-front.png`, `ethan-ref-front.png` 를  
매 프롬프트에 **같은 사람**으로 생성합니다.

---

## 완료 후

「1단계 완료」 → Instagram Meta 토큰(2단계) 안내
