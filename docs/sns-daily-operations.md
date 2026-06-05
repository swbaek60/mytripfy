# SNS 일일·주간 운영 루틴

## 완전 자동 (권장 — Generate 버튼 불필요)

**Windows — 한 번만 등록:**

```powershell
npm run sns:install-task
```

매일 **07:00**에 자동 실행: 캡션·프롬프트·DALL·E 이미지 8장 (`.env.local`의 `OPENAI_API_KEY` 사용)

로그: `scripts/out/sns-auto.log`

**수동 테스트:**

```bash
npm run sns:auto
```

인스타까지 자동 게시 (Meta API 설정 후):

```bash
# .env.sns 에 SNS_AUTO_PUBLISH=true
npm run sns:auto:publish
```

---

## 매일 (수동으로 돌릴 때)

```bash
# 1) 콘텐츠 + 이미지 8장 생성
node scripts/generate-sns-daily.mjs

# 또는 캠페인 시작일 고정
node scripts/generate-sns-daily.mjs --start=2026-05-21

# 2) 전체 파이프라인 (생성만)
node scripts/sns-run-daily.mjs

# 3) Instagram 게시 (이미지 public URL 준비 후)
set SNS_PUBLISH_DRY_RUN=false
node scripts/publish-sns-daily.mjs --date=2026-05-21
```

출력: `scripts/out/YYYY-MM-DD/` — `sua.txt`, `ethan.txt`, `meta.json`, `sua-1~4.png`, `ethan-1~4.png`

## 매주 (월요일 권장)

```bash
node scripts/generate-sns-daily.mjs --days=7 --start=2026-05-21
```

- Reels: `sua.txt` / `ethan.txt` 내 `[Reels]` 섹션 → CapCut으로 mp4 → `sua-reels.mp4`
- Story: 수요일 `[Story]` 프롬프트 참고

## 주간 콘텐츠 믹스

| 요일 | 작업 |
|------|------|
| 매일 | 캐러셀 4장 (스크립트 자동) |
| 월·목 | Reels (스크립트 hook/voiceover) |
| 수 | Story 3장 (수동 또는 추후 API) |

## mytripfy CTA

- 스크립트: 4일마다 챌린지 인증 한 줄 (`day % 4 === 0`)
- Day 1, 7, 30, 180, 365: 수동 강화

## KPI (3개월)

- 팔로워 캐릭터당 500+
- 프로필 링크 클릭 주 10+ (`utm_source=instagram`)
- 참여율 3%+

## 레퍼런스 이미지 (최초 1회)

```bash
node scripts/generate-sns-reference.mjs
```

## YouTube Shorts

```bash
node scripts/youtube-oauth-setup.mjs --character=sua
node scripts/publish-youtube-shorts.mjs --character=sua --file=scripts/out/2026-05-21/sua-reels.mp4
```

## 에이전트 역할

- 매일: `generate-sns-daily` 실행·캡션 검수
- 매주: 7일치 배치
- 토큰 만료 2주 전: `refresh-meta-token.mjs`
