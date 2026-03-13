# 7개 언어(ja, zh, es, fr, de, pt, it) 번역 DB 채우기 — 자세한 절차

챌린지 1600개의 **제목·설명**을 7개 언어로 번역해 `challenge_translations` 테이블에 넣는 방법입니다.  
한 번만 실행하면 되고, 이후 `/ja/...`, `/zh/...` 등 해당 언어로 화면이 나옵니다.

---

## 🆓 무료로 쓰는 방법 (한 달에 2개 언어씩)

Google Cloud Translation API는 **매월 50만 자(character) 무료**입니다.  
한 번에 7개 언어 전부 돌리면 유료가 되므로, **한 달에 2개 언어만** 번역하고 **50만 자 이하**로 제한하면 무료로 쓸 수 있습니다.

### 1) .env.local에 넣을 값 (무료용)

```env
# 번역 시드 (무료 한도용)
LANGUAGES=ja,zh
MAX_CHARS=500000
CHALLENGE_OFFSET=0
```

- **LANGUAGES**: 이번 달에 번역할 언어 (쉼표로 구분). 예: `ja,zh` → 1달차, 다음 달 `es,fr` 등.
- **MAX_CHARS**: 이번 실행에서 쓸 최대 글자 수. `500000`이면 무료 한도 안.
- **CHALLENGE_OFFSET**: 이번 달에 몇 번째 챌린지부터 할지. 첫 달은 `0`, 다음 달부터는 스크립트가 끝날 때 알려주는 숫자로 바꿔 넣으면 됨.

### 2) 매달 실행 순서

| 달 | .env.local 설정 | 설명 |
|----|------------------|------|
| 1 | `LANGUAGES=ja,zh` `MAX_CHARS=500000` `CHALLENGE_OFFSET=0` | ja, zh 앞부분(~384개) 번역 |
| 2 | `CHALLENGE_OFFSET=384` (나머지 동일) | ja, zh 다음 구간 (스크립트 끝에 나오는 다음 OFFSET 값으로 변경) |
| 3 | `CHALLENGE_OFFSET=768` | ja, zh 계속 … |
| … | OFFSET만 올리다가 | ja, zh 1600개 완료 |
| 다음 2개 언어 | `LANGUAGES=es,fr` `CHALLENGE_OFFSET=0` | es, fr 처음부터 동일하게 반복 |

실행은 매달 한 번:

```bash
npm run seed:translations
```

끝나면 터미널에 **다음 달에 넣을 `CHALLENGE_OFFSET=숫자`**가 안내됩니다. 그 숫자를 .env.local의 `CHALLENGE_OFFSET`에 넣고, 다음 달에 다시 실행하면 됩니다.

- **2개 언어**를 **한 달에 50만 자 이하**로만 쓰면 **무료**입니다.
- 7개 언어 전부를 이렇게 하려면 대략 **2개 언어 × 4~5달 ≈ 8~10달** 정도 걸립니다 (한 달에 2개 언어씩, 각 언어당 약 4~5달 분량).

---

## 0. 미리 확인할 것

- **Node.js 20 이상**이면 `npm run seed:translations`가 `.env.local`을 자동으로 읽습니다.  
  `node -v`로 확인하세요. 18 이하면 아래 "Node 18 이하" 절을 따르세요.
- **v28 스키마**를 이미 실행했다고 가정합니다.  
  (`challenge_translations` 테이블이 있어야 합니다.)

---

## 1단계: Google Cloud에서 번역 API 사용 설정

### 1-1. Google Cloud 콘솔 접속

1. 브라우저에서 [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

### 1-2. 프로젝트 선택 또는 생성

1. 상단 프로젝트 선택 드롭다운 클릭
2. **새 프로젝트** → 이름 예: `mytripfy` → **만들기**
3. 만들어진 프로젝트를 선택

### 1-3. Cloud Translation API 켜기

1. 왼쪽 메뉴 **☰** → **API 및 서비스** → **라이브러리**
2. 검색창에 **Cloud Translation API** 입력
3. **Cloud Translation API** 클릭 → **사용** 버튼 클릭  
   (이미 사용 설정됨이면 "API 사용" 상태로만 보이면 됩니다.)

### 1-4. API 키 만들기

1. 왼쪽 **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **API 키**
3. 키가 생성되면 **키 복사** (나중에 `.env.local`에 넣습니다)
4. (권장) **키 제한** 클릭 → **API 제한** → **키 제한** 선택 후  
   **Cloud Translation API**만 체크 → 저장  
   → 이 키가 Translation API 외에 쓰이지 않도록 제한됩니다.

여기까지 하면 **Google 쪽 설정은 끝**입니다.  
발급한 키를 `GOOGLE_CLOUD_TRANSLATE_API_KEY`로 사용합니다.

---

## 2단계: Supabase 서비스 롤 키 확인

시드 스크립트는 **서비스 롤 키**로 DB에 직접 INSERT합니다 (RLS 우회).

1. [Supabase](https://supabase.com/) 로그인 → 해당 프로젝트 선택
2. 왼쪽 **Project Settings** (톱니바퀴) → **API**
3. **Project API keys** 섹션에서:
   - **anon public** 키: 그대로 두고
   - **service_role** 키 옆 **Reveal** 클릭 후 **복사**  
     → 이 값이 `SUPABASE_SERVICE_ROLE_KEY`입니다.  
     ⚠️ 이 키는 절대 클라이언트(브라우저)나 공개 저장소에 넣지 마세요. 서버/스크립트에서만 사용하세요.

---

## 3단계: .env.local에 변수 넣기

프로젝트 루트의 `.env.local` 파일을 엽니다.

**이미 있어야 하는 값:**

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL  
  (Supabase → Project Settings → API → Project URL)
- `SUPABASE_SERVICE_ROLE_KEY` — 위에서 복사한 **service_role** 키

**추가로 넣을 값:**

- `GOOGLE_CLOUD_TRANSLATE_API_KEY` — 1단계에서 복사한 Google API 키

예시 (값은 실제 값으로 바꾸세요):

```env
# 기존
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....

# 번역 시드용 추가
GOOGLE_CLOUD_TRANSLATE_API_KEY=AIzaSy................................
```

저장 후 **이 파일이 Git에 올라가지 않았는지** 확인하세요 (보통 `.env.local`은 `.gitignore`에 있습니다).

---

## 4단계: 시드 스크립트 실행

터미널을 프로젝트 루트에서 연 뒤:

```bash
npm run seed:translations
```

- 챌린지 목록을 Supabase에서 읽어오고  
- Google Translation API로 **ja → zh → es → fr → de → pt → it** 순서로  
  제목·설명을 50개씩 배치로 번역한 뒤  
- `challenge_translations`에 upsert 합니다.

예상 시간: 언어당 1~2분 정도, 총 **대략 10~15분** (API 속도에 따라 다름).

정상이면 예시처럼 나옵니다:

```
챌린지 1600개, 언어 7개(ja,zh,es,fr,de,pt,it) 번역 시작...

[ja]
  ja 완료: 1600건

[zh]
  zh 완료: 1600건
...
시드 완료.
```

에러가 나오면 **5단계(문제 해결)** 를 참고하세요.

---

## 5단계: 실행이 안 될 때 (문제 해결)

### "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요"

- `.env.local`에 두 값이 있는지 확인
- 스크립트가 **프로젝트 루트**에서 실행되는지 확인 (`package.json`이 있는 디렉터리)

### "GOOGLE_CLOUD_TRANSLATE_API_KEY 필요"

- `.env.local`에 `GOOGLE_CLOUD_TRANSLATE_API_KEY=...` 한 줄 추가 후 저장
- 키 앞뒤에 공백이나 따옴표 없이 넣었는지 확인

### "Translate API 403" 또는 "403 Forbidden"

- Cloud Translation API **사용**이 켜져 있는지 다시 확인 (1-3)
- API 키가 **해당 프로젝트**의 키인지 확인
- 결제 계정이 연결되어 있어야 합니다.  
  [Google Cloud 결제](https://console.cloud.google.com/billing)에서 프로젝트에 결제 계정이 연결돼 있는지 봅니다.  
  (Translation API는 무료 할당량이 있지만, 결제 계정 연결은 필요할 수 있습니다.)

### "Translate API 429" (Too Many Requests)

- 잠시 후 다시 실행해 보세요.  
  스크립트는 이미 50개씩 배치로 보내서 호출 횟수를 줄이고 있습니다.

### Node 18 이하에서 ".env.local이 안 읽혀요"

- Node 20 이상을 쓰거나,
- 터미널에서 직접 변수를 넣고 실행:

  ```bash
  set NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  set SUPABASE_SERVICE_ROLE_KEY=eyJ...
  set GOOGLE_CLOUD_TRANSLATE_API_KEY=AIza...
  node scripts/seed-challenge-translations.mjs
  ```
  (Windows CMD 예시. PowerShell은 `$env:NEXT_PUBLIC_SUPABASE_URL="..."` 형태로 설정.)

---

## 6단계: DB에 들어갔는지 확인

1. Supabase → **Table Editor** → **challenge_translations** 선택
2. **lang** 컬럼으로 필터: `ja`, `zh`, `es` 등 선택
3. 각 언어당 **1600행** 정도 있는지 확인 (챌린지 1개당 1행)

또는 SQL Editor에서:

```sql
SELECT lang, COUNT(*) FROM challenge_translations GROUP BY lang ORDER BY lang;
```

예상 결과: `en`, `ko`(기존 시드) + `de`, `es`, `fr`, `it`, `ja`, `pt`, `zh` 각각 약 1600행.

---

## 요약 체크리스트

- [ ] Node 20+ 또는 env 수동 설정
- [ ] Google Cloud: 프로젝트 생성 → Translation API 사용 → API 키 생성·복사
- [ ] Supabase: service_role 키 복사
- [ ] `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLOUD_TRANSLATE_API_KEY` 추가
- [ ] `npm run seed:translations` 실행
- [ ] Table Editor 또는 SQL로 `challenge_translations` 행 수 확인

이후 앱에서 `/ja/challenges/foods`, `/zh/challenges/countries` 등으로 접속하면 해당 언어로 제목·설명이 표시됩니다.
