# SNS 이미지 — Cursor Generate 버튼 (수동, 고품질)

API(Pollinations/Gemini) 대신 **채팅에서 Generate**로 이미지를 만들 때의 루틴입니다.

## 같은 날 OOTD · 악세서리 고정 (필수)

하루 캐러셀 4장은 **옷·색상·악세서리가 모두 동일**해야 합니다.

정책 단일 정의: **`scripts/lib/sns-rotation-policy.mjs`**

| 규칙 | 값 |
|------|-----|
| 같은 날 4장 | 동일 OOTD (`promptLock` 고정) |
| 전날 | **반드시 다른** 의상 |
| 재착용 | **10일 후** 가능 (최근 9일은 금지) |
| 연간 풀 | 캐릭터당 **50벌** (`sns-ootd-catalog.mjs` + `sns-ootd-expanded.mjs`) |
| 날짜별 장소 | 국가별 itinerary variant (`sns-day-itineraries.mjs`) |
| 날씨 | 당일 방문 도시 Open-Meteo → OOTD 후보 필터 (`sns-weather.mjs`) |

`meta.json`에 `outfit.index`·`rotationPolicy`가 기록되며, 다음 날 txt/이미지 생성 시 자동 참조됩니다.

- **연속 날짜·인접 월**에는 **다른 옷** (`scripts/lib/sns-rotation-policy.mjs` + `sns-daily-rotation.mjs` — 전날 다름, **최근 9일 재착용 금지**, **10일 후 재착용 OK**, 캐릭터당 **~50벌** 풀)
- **관광지**는 매일 다른 일정 (`scripts/lib/sns-day-itineraries.mjs` — 국가별 variant, 날짜별 로테이션)
- 정의: `scripts/lib/sns-ootd-catalog.mjs` (일차별 상의/하의/신발/가방/귀걸이 등)
- `sua.txt` / `ethan.txt` 상단 `[오늘의 OOTD · 캐러셀 4장 동일]` 블록과 이미지 프롬프트의 `promptLock`을 **그대로** 사용
- Generate 시 4장 모두 같은 `promptLock` 문구 포함 (표정·장소만 슬라이드별 변경)

## 날씨에 맞는 옷 (자동, 필수)

`npm run sns:auto -- --no-images` 또는 `generate-sns-daily.mjs` 실행 시:

1. 일정 도시(예: 도쿄·토론토)의 **해당 날짜** 기온·강수를 [Open-Meteo](https://open-meteo.com/)로 조회 (`scripts/lib/sns-weather.mjs`)
2. 더움/따뜻/선선/추움·비 여부에 맞게 OOTD 프리셋으로 **자동 교체** (캐러셀 4장은 여전히 동일 옷)
3. `sua.txt` / `ethan.txt` 맨 위에 `[날씨 · City YYYY-MM-DD]` 블록 기록

Generate 전에 **반드시** 위 명령으로 txt를 최신화한 뒤, txt 프롬프트·레퍼런스로 이미지 8장을 만든다.

## 실루엣·단추·벨트·가방 디테일 고정 (필수)

캐러셀 4장에서 다음이 슬라이드마다 달라지면 안 됩니다.

- **옷 실루엣**: 원피스/재킷 **핏·기장·칼라·소매** (다른 스타일로 바뀌면 안 됨)
- **단추 색·개수**, **벨트·버클**
- **가방**: 동일 **모델** (라운드 바스켓 vs 토트 vs 크로스바디로 바뀌면 안 됨)
- **귀걸이** 등 악세서리

- 정의: `scripts/lib/sns-ootd-detail-lock.mjs` → `promptLock` + txt `[디테일 고정 · …]`
- Generate 시 해당 문구를 **빼지 말고** 그대로 사용 (표정·장소만 슬라이드별 변경)

### 슬라이드 2~4 — slide-1을 outfit 레퍼런스로

1. 먼저 `sua-1.png` / `ethan-1.png` 생성·확인
2. `sua-2`~`4` Generate 시 `reference_image_paths`에 추가:
   - `assets/sns/sua-ref-front.png`, `sua-ref-full.png` (얼굴)
   - `scripts/out/날짜/sua-1.png` (**옷·가방 실루엣** — slide-1과 동일하게)

## 실제 사진 스타일 (항상 적용)

모든 일일/API 프롬프트는 `scripts/lib/sns-campaign-config.mjs` 의 **`PHOTO_REALISM`** · **`wrapTravelPhotoPrompt()`** 로 자동 래핑됩니다.  
Generate 시에는 `sua.txt` / `ethan.txt`에 적힌 프롬프트를 **그대로** 쓰면 됩니다 (이미 실사 키워드 포함).

- 실제 카메라·피부 질감·그레인·불완전한 프레이밍
- 금지: illustration, CGI, beauty filter, plastic skin

## 매일 루틴

### 1) 캡션·프롬프트만 자동 생성

```powershell
npm run sns:auto -- --no-images
```

또는:

```powershell
node --env-file=.env.local scripts/generate-sns-daily.mjs --no-images
```

→ `scripts/out/오늘날짜/sua.txt`, `ethan.txt`, `meta.json` 생성

`SNS_CAMPAIGN_START`(`.env.local`) 기준으로 **Day 번호**가 정해지며, 같은 나라여도 **일차마다 다른 장소·테마** (`scripts/lib/sns-day-itineraries.mjs`).

**이든:** `scripts/lib/sns-body-framing.mjs` — 키 188cm·8등신·슬라이드별 **다른 포즈** (`Pose:` in txt). Generate 시 `ethan-ref-full.png` 레퍼런스 권장.

### 2) 채팅에서 이미지 8장 생성 (Generate 버튼)

에이전트에게 예:

> 오늘 `scripts/out/2026-05-22` 수아·이든 캐러셀 이미지 8장 Generate로 만들어줘.  
> `sua.txt` / `ethan.txt` 프롬프트 순서대로, 레퍼런스는 `assets/sns/`.

저장 파일명 (반드시 이 이름):

| 파일 |
|------|
| `sua-1.png` ~ `sua-4.png` |
| `ethan-1.png` ~ `ethan-4.png` |
| (2단계) `pinned/sua-pinned.png` — 고정 게시용 |

### 3) 인스타 업로드 (Meta 설정 후)

```powershell
npm run sns:auto:publish
```

또는 이미지만 올리기:

```powershell
node --env-file=.env.local scripts/upload-sns-images.mjs --date=2026-05-22
```

## 레퍼런스

- 수아: `assets/sns/sua-ref-front.png`, `sua-ref-full.png`
- 이든: `assets/sns/ethan-ref-front.png`, `ethan-ref-full.png`

## 참고

- `.env.local` 에 `SNS_IMAGE_PROVIDER=pollinations` 가 있어도 `--no-images` 면 API 이미지는 안 만듦
- Generate는 **레퍼런스 수정·특별 컷**에, 일상 8장은 위 루틴
