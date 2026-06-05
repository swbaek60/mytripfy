# Meta Graph API 설정 (Instagram 자동 게시)

## 1. 사전 조건

- 수아·이든 Instagram **Professional (Creator)** 계정
- 각각 연결된 **Facebook Page**
- [docs/sns-account-setup.md](sns-account-setup.md) 계정 생성 완료

## 2. Facebook 앱

1. [developers.facebook.com](https://developers.facebook.com) → 앱 만들기 → **Business**
2. 제품 추가: **Instagram Graph API**, **Facebook Login**
3. 권한 (앱 검수 후 프로덕션):
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`

## 3. 토큰 발급

1. Graph API Explorer에서 User Token 발급 (위 권한 포함)
2. `.env.sns` 에 `META_APP_ID`, `META_APP_SECRET`, 단기 토큰을 `META_SHORT_LIVED_TOKEN` 에 넣기
3. 갱신:

```bash
node scripts/refresh-meta-token.mjs
```

출력된 `META_ACCESS_TOKEN` 을 `.env.sns` 에 저장.

## 4. Instagram User ID

Graph API Explorer:

```
GET /me/accounts
→ page id → GET /{page-id}?fields=instagram_business_account
```

`.env.sns`:

```
INSTAGRAM_SUA_USER_ID=...
INSTAGRAM_ETHAN_USER_ID=...
```

## 5. 이미지 공개 URL (필수)

Meta API는 **로컬 파일을 직접 올릴 수 없음**. Supabase Storage public bucket 예:

1. 버킷 `sns` 생성 (public)
2. `scripts/out/YYYY-MM-DD/*.png` 업로드
3. `.env.sns`:

```
SNS_IMAGE_BASE_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/sns/
```

## 6. 게시 테스트

```bash
# dry-run (기본)
node scripts/publish-sns-daily.mjs --date=2026-05-21

# 실제 게시
set SNS_PUBLISH_DRY_RUN=false
node scripts/publish-sns-daily.mjs --date=2026-05-21 --base-url=https://...
```

## 7. GitHub Actions

Repository Secrets:

- `OPENAI_API_KEY`
- `SNS_CAMPAIGN_START`
- (게시 시) `META_ACCESS_TOKEN`, `INSTAGRAM_SUA_USER_ID`, `INSTAGRAM_ETHAN_USER_ID`, `SNS_IMAGE_BASE_URL`

Workflow: `.github/workflows/sns-daily.yml` — 수동 실행 시 `publish: true` 선택.
