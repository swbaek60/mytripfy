# 수아 Instagram — 단계별 진행 (최소 수동)

## 계정 정보 (기록)

| 항목 | 값 |
|------|-----|
| 이메일 | `arc.work.lab+sua@gmail.com` |
| 표시 이름 | Lee sua → 권장: **Sua \| 100 Countries** |
| 핸들(아이디) | `@sua.mytripfy` ✅ |
| Meta 계정 센터 | Facebook + Instagram 연결 ✅ |
| 캠페인 시작일 | **2026-05-22** (Day 1) |

## 자동화 vs 수동

| 작업 | 누가 |
|------|------|
| 캡션·프롬프트·일정 | ✅ `npm run sns:text` |
| 이미지 4장 | ✅ 채팅 Generate (당신 버튼) |
| Supabase 업로드 | ✅ `upload-sns-images.mjs` (Meta 준비 후) |
| 인스타 게시 | ✅ `publish-sns-daily.mjs --character=sua` (Meta 토큰 후) |
| 페이스북 자동 | ⏳ 인스타 연동만 켜면 됨 (2단계) |
| 유튜브 | ⏳ 이든·수아 Reels mp4 후 (4단계) |

---

## 지금 할 일 — 1단계만 (프로필, 약 10분)

### 1) 프로페셔널 계정
인스타 앱 → 프로필 → **설정** → **계정** → **프로페셔널 계정** → **크리에이터**

### 2) 프로필 사진
`assets/sns/sua-ref-front.png` 업로드

### 3) 이름·소개·링크

**이름:** `Sua | 100 Countries`

**소개 (복사):**
```
✨ AI 가상 여행 스토리 · 1년 100개국
🇰🇷 한국 출발 · 맛집·패션·여행
버킷리스트 👇 mytripfy
```

**링크:** `https://www.mytripfy.com?utm_source=instagram&utm_medium=social&utm_campaign=100countries_sua`

### 4) 완료 확인
- [x] 크리에이터 계정
- [x] 프로필 사진
- [x] 링크 열림
- [x] Meta 계정 센터 (FB + IG)

**1단계 완료** → 아래 2단계 진행

---

## 2단계: 고정 게시 + Day 1 캐러셀 (지금)

### A) 고정 게시 (1장)

1. `scripts/out/pinned/sua-pinned.png` 업로드
2. 캡션 (`scripts/out/pinned/sua-pinned-caption.txt`):

```
안녕하세요, 수아예요 ✈️

이 계정은 AI로 만든 가상의 여행 캐릭터 스토리입니다. 1년 동안 100개국 챌린지를 진행하며 버킷리스트는 mytripfy에서 관리해요.

#mytripfy #100CountriesChallenge #AIgenerated

🇰🇷 한국에서 100개국 챌린지 시작!
```

3. 게시 → ⋯ → **프로필에 고정**

### B) Day 1 캐러셀 (4장)

1. `scripts/out/2026-05-22/sua-1.png` ~ `sua-4.png` 순서대로
2. 캡션 (`scripts/out/2026-05-22/sua.txt`):

```
한국에서 하루 ✈️ 맛집·OOTD·저녁 뷰까지. 1/100! 버킷리스트는 mytripfy 👇
#mytripfy #100CountriesChallenge #OOTD #맛집 #여행패션 #SouthKorea 1/100
```

**2단계 완료** ✅ (고정 + Day1 캐러셀 게시됨)

---

## 3단계: Meta 자동 업로드 — **보류 (수동 운영 선택)**

B·C·D(개발자 앱·토큰·Supabase URL)는 **나중에** 필요할 때 [sns-meta-api-setup.md](sns-meta-api-setup.md) 참고.

**현재 운영:** 아래 「수동 매일 루틴」

---

## 수동 매일 루틴 (Day 2~)

### 1) 오늘 캡션·프롬프트만 생성

```powershell
npm run sns:text
```

또는 특정 날짜:

```powershell
node --env-file=.env.local scripts/generate-sns-daily.mjs --no-images --date=2026-05-23
```

→ `scripts/out/오늘날짜/sua.txt` 확인

### 2) 이미지 4장 (Generate)

채팅에 예:

> 오늘 `scripts/out/날짜` 수아 캐러셀 4장 Generate. `sua.txt` 프롬프트 순서, 레퍼런스 `assets/sns/sua-ref-front.png`, 실사 스타일.

저장: `sua-1.png` ~ `sua-4.png` (같은 폴더)

### 3) 인스타 앱에서 게시

- `sua-1` → `sua-4` 순서 캐러셀
- 캡션: `sua.txt`의 `[캡션 · 한 포스트에 그대로 사용]` 블록 복사
- (선택) Facebook 공유 켜기

상세: [sns-수동-이미지-워크플로.md](sns-수동-이미지-워크플로.md)

---

## 3단계 (자동화 — 참고용, 미사용)

## 3단계: Meta 자동 업로드 (자동화 선택 시)

자동 게시는 **로컬 PNG → Supabase 공개 URL → Meta API** 순서입니다.  
아래 **A → F** 를 한 번만 설정하면, 이후 `npm run sns:auto:publish` 로 매일 올릴 수 있습니다.

### A) 페이스북 **페이지** 만들기 + 인스타 연결 (필수)

Meta API는 **개인 FB가 아니라 페이지**에 연결된 인스타만 게시할 수 있습니다.

1. [facebook.com/pages/create](https://www.facebook.com/pages/create)
2. 페이지 이름: `Sua | 100 Countries Challenge` · 카테고리: 여행/크리에이터
3. 페이지 **설정** → **연결된 계정** → Instagram `@sua.mytripfy` 연결  
   (또는 인스타 앱 → 설정 → **계정 센터** → 페이지 연결)
4. 인스타 **크리에이터** 계정 유지 확인

### B) Meta 개발자 앱 (10~15분)

1. [developers.facebook.com](https://developers.facebook.com) → **앱 만들기** → 유형 **비즈니스**
2. 제품 추가: **Instagram** (Graph API), **Facebook Login** (선택)
3. **앱 역할** → 본인 Facebook 계정을 **관리자/테스터**로 추가  
4. **개발 모드**에서도 **본인 계정**에는 테스트 게시 가능 (앱 검수는 나중에)

### C) 토큰 + Instagram User ID 발급

1. [Graph API Explorer](https://developers.facebook.com/tools/explorer/) → 방금 만든 앱 선택
2. **Generate Access Token** → 권한 체크:
   - `instagram_basic`, `instagram_content_publish`
   - `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` (있으면)
3. Explorer에서 순서대로:

```
GET /me/accounts
```

→ 수아 **페이지 id** 복사

```
GET /{페이지-id}?fields=instagram_business_account
```

→ `instagram_business_account.id` 가 **INSTAGRAM_SUA_USER_ID**

4. 토큰은 **장기 토큰** 권장: `scripts/refresh-meta-token.mjs` (또는 Meta 문서의 long-lived token)

### D) Supabase 공개 버킷 (이미지 URL)

1. Supabase 대시보드 → Storage → 버킷 **`sns`** 생성 → **Public**
2. `scripts/out/2026-05-22/` 안의 `sua-1.png`~`sua-4.png` 업로드 (폴더명 = 날짜)
3. 공개 URL 예:

`https://YOUR_PROJECT.supabase.co/storage/v1/object/public/sns/2026-05-22/sua-1.png`

→ `.env.local` 또는 `.env.sns` 에:

```
SNS_IMAGE_BASE_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/sns/
```

### E) 비밀키 저장 (PC에서 1회)

```powershell
npm run sns:secrets
```

입력 항목:

| 항목 | 저장 파일 |
|------|-----------|
| Meta Access Token | `secrets/meta-token.txt` |
| Instagram Sua User ID | `secrets/instagram-sua-id.txt` |

→ `.env.sns` 자동 생성 (`npm run sns:setup` 도 동일)

### F) 테스트

```powershell
# 업로드만 (게시 X)
node --env-file=.env.local scripts/upload-sns-images.mjs --date=2026-05-23

# 게시 dry-run (API 호출 없이 URL 확인)
node --env-file=.env.local scripts/publish-sns-daily.mjs --date=2026-05-22 --character=sua

# 실제 자동 (이미지 생성+업로드+게시) — Day2부터
npm run sns:auto:publish
```

**3단계 끝나면 「수아 3단계 완료」** → Windows 작업 스케줄러·Day2 일정 안내

상세: [sns-meta-api-setup.md](sns-meta-api-setup.md)

---

## 오늘(Day 1) 준비된 파일

| 파일 | 용도 |
|------|------|
| `scripts/out/pinned/sua-pinned-caption.txt` | 고정 게시 캡션 |
| `scripts/out/pinned/sua-pinned-prompts.txt` | 고정 게시 이미지 4장 프롬프트 |
| `scripts/out/2026-05-22/sua.txt` | 오늘 캐러셀 캡션+프롬프트 |

`.env.local` 에 `SNS_CAMPAIGN_START=2026-05-22` 설정됨.
