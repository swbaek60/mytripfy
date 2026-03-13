# 명예의 전당 SQL 실행 안내

Supabase 대시보드 → **SQL Editor**에서 아래 순서대로 실행하세요.

---

## 실행 순서 (반드시 1 → 2 → 3)

### 1. `schema-v31-hall-of-fame-view-and-backfill.sql`
- **역할**: 경험 랭킹(챌린지 인증) 뷰 생성 + 프로필 점수 동기화
- **생성**: 뷰 `hall_of_fame_leaderboard`
- **효과**: 챌린지 인증한 사람이 경험 랭킹/종합 랭킹에 표시되고, 대시보드/프로필의 챌린지 점수가 실제 인증 기준으로 맞춰짐

### 2. `schema-v32-contribution-leaderboard.sql`
- **역할**: 기여 랭킹(동행·가이드·리뷰) 뷰 생성
- **생성**: 뷰 `contribution_leaderboard`
- **점수**: 동행 글 5pts, 동행 참여 수락 10pts, 가이드 매칭 수락 15pts, 받은 리뷰 3pts
- **참고**: `reviews` 테이블 컬럼명이 `reviewed_id`이면 파일 안 주석대로 `reviewee_id` → `reviewed_id`로 바꾼 뒤 실행

### 3. `schema-v33-overall-leaderboard.sql`
- **역할**: 종합 랭킹(경험+기여 합산) 뷰 생성
- **생성**: 뷰 `overall_leaderboard`
- **조건**: 1번, 2번 실행이 끝난 뒤에 실행

---

## 한 번에 실행하려면

`schema-hall-of-fame-all.sql` 파일 내용을 SQL Editor에 붙여 넣고 **Run** 하면 위 1~3을 한 번에 적용할 수 있습니다.
