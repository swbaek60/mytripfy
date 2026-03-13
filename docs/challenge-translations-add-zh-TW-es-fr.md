# 챌린지 번역에 zh-TW, es, fr 추가하기 (단계별)

영어(원문) → **zh-TW(중국어 번체), es(스페인어), fr(프랑스어)** 3개 언어를 Google Cloud Translation API로 번역해 `challenge_translations` 테이블에 넣는 방법입니다.

---

## 사전 확인

- 이미 **ko, ja, zh**(간체) 중 일부는 API로 번역해 두신 상태라고 가정합니다.
- **zh-TW, es, fr**은 이 가이드대로 실행하면 **번역이 없는 챌린지만** API로 번역 후 DB에 저장됩니다. (이미 있는 행은 건너뜀)

---

## 1단계: Google Cloud Translation API 준비

1. [Google Cloud Console](https://console.cloud.google.com/) 접속 후 프로젝트 선택.
2. **API 및 서비스** → **라이브러리** → **Cloud Translation API** 검색 후 **사용** 설정.
3. **사용자 인증 정보** → **API 키 만들기** → 키 복사.
4. (권장) 해당 API 키 **제한** → **API 제한** → **Cloud Translation API**만 선택 후 저장.

`.env.local`에 다음이 있어야 합니다 (없으면 추가).

```env
GOOGLE_CLOUD_TRANSLATE_API_KEY=여기에_복사한_키
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 2단계: 이번에 넣을 언어만 지정

무료 한도(월 50만 자)를 고려해, **이번 실행에서는 zh-TW, es, fr 3개만** 번역하려면:

**.env.local**에 아래를 추가하거나 수정합니다.

```env
# 이번에 번역할 언어 (쉼표 구분, 공백 없이)
LANGUAGES=zh-TW,es,fr
```

- `LANGUAGES`를 넣지 않으면 스크립트 기본값(ko, ja, zh, zh-TW, es, fr, de, pt, it) 전부 대상이 됩니다.
- **한 번에 3개 언어만** 하려면 반드시 `LANGUAGES=zh-TW,es,fr` 로 지정하는 것이 좋습니다.

(선택) 무료 한도 안 쓰려면:

```env
LANGUAGES=zh-TW,es,fr
MAX_CHARS=500000
```

- `MAX_CHARS`를 설정하면, 예상 글자 수가 이 값을 넘지 않도록 챌린지 개수를 잘라서 번역합니다.

---

## 3단계: 시드 스크립트 실행

프로젝트 루트에서:

```bash
npm run seed:translations
```

- Node 20+ 환경에서는 `.env.local`을 자동으로 읽습니다.
- 챌린지 목록을 읽어와 **zh-TW, es, fr** 각각에 대해, **아직 번역이 없는 (challenge_id, lang) 조합만** Google API로 번역 후 `challenge_translations`에 upsert 합니다.

실행 시 터미널에 예시처럼 나오면 정상입니다.

```
챌린지 전체 1600건 로드됨
챌린지 1600개, 언어 3개 (zh-TW, es, fr) — 번역 없는 것만 처리

[zh-TW] 번역 필요: 1600건 ...
  zh-TW 완료: 1600건
[es] 번역 필요: 1600건 ...
  es 완료: 1600건
[fr] 번역 필요: 1600건 ...
  fr 완료: 1600건

시드 완료.
```

---

## 4단계: DB에 들어갔는지 확인

1. Supabase **Table Editor** → **challenge_translations** 선택.
2. **lang** 컬럼으로 필터: `zh-TW`, `es`, `fr` 각각 확인.
3. 각 언어당 챌린지 수(약 1600행)만큼 행이 있는지 확인.

또는 **SQL Editor**에서:

```sql
SELECT lang, COUNT(*) 
FROM challenge_translations 
WHERE lang IN ('zh-TW', 'es', 'fr') 
GROUP BY lang 
ORDER BY lang;
```

---

## 5단계: 앱에서 확인

- **zh-TW**: `https://사이트/zh-TW/challenges/countries` 등으로 접속해 제목·설명이 번체 중국어로 나오는지 확인.
- **es**: `https://사이트/es/challenges/countries` 로 접속해 스페인어로 나오는지 확인.
- **fr**: `https://사이트/fr/challenges/countries` 로 접속해 프랑스어로 나오는지 확인.

---

## 요약 체크리스트

| 순서 | 작업 |
|------|------|
| 1 | Google Cloud에서 Translation API 사용 설정 및 API 키 발급 |
| 2 | `.env.local`에 `GOOGLE_CLOUD_TRANSLATE_API_KEY`, `LANGUAGES=zh-TW,es,fr` 설정 |
| 3 | `npm run seed:translations` 실행 |
| 4 | Supabase `challenge_translations`에서 zh-TW, es, fr 행 수 확인 |
| 5 | 앱에서 /zh-TW/, /es/, /fr/ 챌린지 페이지로 표시 확인 |

---

## 참고

- **이미 ko, ja, zh만 API로 번역했다**면, 이번 실행은 **zh-TW, es, fr**만 추가로 채우면 됩니다. 기존 ko, ja, zh 행은 건드리지 않습니다.
- 스크립트는 `scripts/seed-challenge-translations.mjs` 이며, `LANGUAGES`가 있으면 그 언어들만 처리합니다.
- 앱 쪽에서는 이미 `zh-TW`가 `PRELOADED_LOCALES`에 포함되어 있어, DB에 번역이 있으면 zh-TW locale에서 챌린지 제목·설명이 표시됩니다.
