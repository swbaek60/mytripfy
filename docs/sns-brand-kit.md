# SNS 브랜드 키트 (수아 · 이든)

## 계정 (확정안)

| 캐릭터 | Instagram 핸들 | 표시 이름 | 언어 |
|--------|----------------|-----------|------|
| 수아 | `@sua.mytripfy` | Sua \| 100 Countries | 한글 + 영어 해시태그 |
| 이든 | `@ethan.mytripfy` | Ethan \| 100 Countries | 영어 |

## 캡션·톤 분리 (필수)

설정: `scripts/lib/sns-campaign-config.mjs` → **`ACCOUNT_PERSONA`**

- **수아·이든은 서로 모르는 별개 인물** (크로스 멘션·짝 맞춘 문구 금지)
- **수아:** 한국어 여행 일기 · `📍 오늘 한 일` 번호 목록
- **이든:** 미국식 캐주얼 · 단락/대시/유머 등 **10가지 스타일 로테이션** (수아와 동일 포맷 사용 금지)
- 같은 운영자 느낌 방지: 오프닝·CTA·해시태그 패턴을 의도적으로 다르게

프로필 링크: `https://www.mytripfy.com?utm_source=instagram&utm_medium=social&utm_campaign=100countries_{sua|ethan}`

## AI 고지 (프로필 + 고정 게시)

**수아 프로필 한 줄**
```
✨ AI로 제작된 가상의 여행 스토리 · 1년 100개국 챌린지
```

**이든 프로필 한 줄**
```
🌍 AI-generated travel story · 100 countries in 1 year
```

고정 게시 캡션은 `node scripts/generate-sns-pinned.mjs` 실행 후 `scripts/out/pinned/` 참고.

## 레퍼런스 이미지

저장소에 예전 PNG가 없으면 아래로 **새로 생성**:

```bash
set OPENAI_API_KEY=sk-...
node scripts/generate-sns-reference.mjs
```

생성 위치:

- `assets/sns/sua-ref-front.png` — 정면 프로필용
- `assets/sns/sua-ref-full.png` — 전신
- `assets/sns/ethan-ref-front.png`
- `assets/sns/ethan-ref-full.png`

이후 일일 이미지 프롬프트는 `scripts/lib/sns-campaign-config.mjs`의 `faceBlock`과 동일 묘사를 사용합니다.

## CTA 빈도

- 3~5포스트 중 1회만 mytripfy·챌린지 인증 언급 (`day % 4 === 0` 로 스크립트 반영)
- Day 1, 7, 30, 180, 365는 수동으로 스토리 강화 권장
