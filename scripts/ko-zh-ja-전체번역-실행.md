# 한국어·중국어·일본어 챌린지 설명 전체 번역

챌린지(100 Restaurants 등)에서 ko/zh/ja 선택 시 설명이 영어로만 나오는 경우, 시드 스크립트로 **challenge_translations** 테이블에 번역을 채우면 됩니다.

## A. 전부 한 번에 번역 (권장)

**.env.local**

```env
LANGUAGES=ko,zh,ja
CHALLENGE_OFFSET=0
# MAX_CHARS 는 비우거나 0 으로 두기 (제한 없이 전부 처리)
```

**실행**

```bash
node --env-file=.env.local scripts/seed-challenge-translations.mjs
```

- 0번째~마지막(약 1559개)까지 **전부** ko, zh, ja 로 번역됩니다.
- 끝나면 앱에서 해당 언어 선택 시 번역된 설명이 나와야 합니다.

## B. 1000번 이후만 번역하고 싶을 때

이미 0~999번은 돌렸고, **1000번째 이후만** 영어로 남아 있다면:

**.env.local**

```env
LANGUAGES=ko,zh,ja
CHALLENGE_OFFSET=1000
```

**실행**

```bash
node --env-file=.env.local scripts/seed-challenge-translations.mjs
```

- 1000번 인덱스부터 끝까지(약 559개)만 번역됩니다.

## 3. 무료 한도 맞추고 나눠 할 때

Google 번역 무료 한도(월 50만 자 등)를 지키려면:

- `MAX_CHARS=400000` 등으로 제한하고
- `LANGUAGES=ko` 만 먼저 실행 → 다음 달에 `LANGUAGES=zh`, 그다음 `LANGUAGES=ja` 식으로 나눠 실행하세요.
- 또는 `CHALLENGE_OFFSET`을 올려가며 여러 번 실행하면 됩니다.
