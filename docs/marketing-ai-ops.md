# mytripfy Growth Ops (광고비 0)

이전 SEO 블로그·디렉토리 팩은 **후순위**. 우선순위는 숏폼 훅 + 도시 밀도 + 리퍼럴입니다.

## 매일 자동 (`npm run marketing:daily`)

1. **Short-form hooks** → `scripts/out/marketing/shorts/` (TikTok/Reels/Shorts 스크립트 12개)
2. IG 파이프라인 (시크릿 있을 때)
3. 리포트 → `scripts/out/marketing/reports/`

Windows: `MyTripfy-Marketing-Daily` 07:15

## 사람이 영상만 올리면 되는 것

훅 텍스트는 AI가 매일 생성함. TikTok/Reels/YouTube에 **계정으로 업로드**만 하면 됨 (API 없이도 동작).

인덱스: `scripts/out/marketing/shorts/YYYY-MM-DD-INDEX.md`

## 도시 밀도 SEO

| URL | 내용 |
|-----|------|
| `/destinations/seoul` | 서울 열린 동행 (실데이터) |
| `/destinations/tokyo` | 도쿄 |
| `/destinations/bangkok` | 방콕 |
| `/destinations/osaka` | 오사카 |
| `/destinations/danang` | 다낭 |

시드: mytripfy Community + Sua + Ethan 오픈 트립 (플랫폼/캠페인 계정, 가짜 일반 유저 아님).

## 리퍼럴

- DB: `profiles.referral_code`, `referred_by`, `referral_count`
- `/[locale]/invite/[code]` → 쿠키 → 가입 시 귀속
- `?ref=CODE` 전역 미들웨어 쿠키
- 프로필 페이지에서 초대 링크 복사

## 명령

```bash
npm run marketing:daily -- --skip-ig --hooks=12
npm run marketing:check
npm run deploy:prod
```

## 한계 (자동화 불가)

- TikTok/IG 계정 생성·영상 게시 클릭
- 호스텔 오프라인 방문
- Meta 토큰 없으면 IG 자동 게시 불가
