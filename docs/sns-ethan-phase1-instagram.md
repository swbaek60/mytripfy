# 이든 Instagram + Facebook — 단계별 (수아와 동일 흐름)

## 계정 정보 (권장)

| 항목 | 값 |
|------|-----|
| 이메일 | `arc.work.lab+ethan@gmail.com` (Gmail +별칭, 수아와 동일 방식) |
| 인스타 아이디 | **`ethan.mytripfy`** (수아 `@sua.mytripfy` 와 통일) · 안 되면 `ethan.100countries` |
| 표시 이름 | **Ethan \| 100 Countries** |
| 페이스북 페이지 | `Ethan \| 100 Countries Challenge` |
| 출발 | 🇺🇸 미국 · 캡션·소개는 **영어** |
| 운영 | **수동** (수아와 동일, Meta API 보류) |

## 레퍼런스 이미지

| 용도 | 파일 |
|------|------|
| 프로필 | `assets/sns/ethan-ref-front.png` |
| 전신 | `assets/sns/ethan-ref-full.png` |

---

## 0단계: 계정 만들기 (수아에서 배운 방법)

### ❌ 피할 것

- PC 웹 `instagram.com/accounts/emailsignup` 에 **이메일만** 넣고 반복 가입 → `가입 중에 오류가 발생했습니다`
- 페이스북과 **같은 이메일로 인스타 이메일 가입** (충돌 잦음)

### ✅ 권장 순서

1. **페이스북** 가입 — `arc.work.lab+ethan@gmail.com` (수아 FB와 **별도** 계정)
2. **Instagram 앱** → 가입 → **Facebook으로 계속하기** → 방금 만든 이든 FB로 로그인
3. 인스타 **사용자 이름** `ethan.mytripfy` · 비밀번호 설정
4. **Meta 계정 센터** — 이든 FB + 이든 IG 연결 (수아 계정과 **추가**, 같은 센터에 2세트 가능)
5. 페이스북 **개인** 사용자 이름은 필수 아님 (막히면 건너뛰기)

**팁:** 수아 계정에 로그인된 브라우저와 분리 — **시크릿 창** 또는 **다른 브라우저** / **폰 앱**에서 이든만 가입.

---

## 1단계: 프로필 (약 10분)

### 1) 크리에이터 계정

설정 → 계정 → **프로페셔널 계정** → **크리에이터**

### 2) 프로필 사진

`assets/sns/ethan-ref-front.png`

### 3) 이름·소개·링크

**이름:** `Ethan | 100 Countries`

**소개 (복사):**
```
🌍 AI-generated travel story · 100 countries in 1 year
🇺🇸 Starting from the US → adventure & friends worldwide
Bucket list on mytripfy 👇
```

**링크:** `https://www.mytripfy.com?utm_source=instagram&utm_medium=social&utm_campaign=100countries_ethan`

### 4) 페이스북 페이지 + 연결 (A단계)

1. [facebook.com/pages/create](https://www.facebook.com/pages/create)
2. 페이지 이름: `Ethan | 100 Countries Challenge`
3. 카테고리: Travel / Creator
4. 페이지 ↔ `@ethan.mytripfy` 연결
5. 인스타 설정 → **Facebook에 공유** 켜기

**끝나면 「이든 1단계 완료」** + 실제 인스타 아이디 알려주기

---

## 2단계: 고정 게시 + Day 1 캐러셀

채팅에 요청 예:

> 이든 2단계: 고정 + Day1 캐러셀 이미지 만들어줘 (`scripts/out/2026-05-22` 또는 오늘 날짜)

| 항목 | 파일 |
|------|------|
| 고정 이미지 | `scripts/out/pinned/ethan-pinned.png` (생성 후) |
| 고정 캡션 | `scripts/out/pinned/ethan-pinned-caption.txt` |
| 캐러셀 1~4 | `scripts/out/날짜/ethan-1.png` ~ `ethan-4.png` |
| 캡션 | `scripts/out/날짜/ethan.txt` |

**고정 캡션:**
```
Hey, I'm Ethan ✈️

This is an AI-generated fictional travel character. One year, 100 countries — bucket list on mytripfy.

#mytripfy #100CountriesChallenge #AIgenerated

🇺🇸 Starting from the US — Day 1/100!
```

**Day 1 캡션:** `ethan.txt` 의 `[Caption · use as single post]` 블록

---

## 수동 매일 루틴 (1단계 후)

```powershell
npm run sns:text
```

→ `scripts/out/오늘날짜/ethan.txt` + Generate 4장 → 인스타 업로드

---

## 완료 체크

- [ ] FB 계정 (이든 전용 이메일)
- [ ] IG `@ethan.mytripfy` (또는 확정 아이디)
- [ ] Meta 계정 센터 연결
- [ ] 크리에이터 + 프로필 + 링크
- [ ] FB 페이지 연결
- [ ] 고정 + Day1 게시 (2단계)
