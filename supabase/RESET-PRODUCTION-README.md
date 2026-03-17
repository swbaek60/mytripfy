# 테스트 데이터 전체 삭제 (실서비스 전 초기화)

실제 서비스를 시작하기 전, 테스트 회원·게시글·매장·인증·메시지 등을 모두 지우고 깨끗한 상태로 만드는 방법입니다.

## 1. DB 데이터 삭제 (Supabase SQL)

1. **Supabase Dashboard** → **SQL Editor** 이동
2. **New query** 선택 후 `supabase/reset-production-data.sql` 파일 내용을 **전부 복사**해 붙여넣기
3. **Run** 실행

이 스크립트가 삭제하는 항목:

- 알림, 메시지, 채팅 참여자·채팅방
- 동행 찾기 Q&A, 동행 신청, 동행 게시글
- 리뷰, 북마크
- 여행(trips)·일정(trip_days)·일정 상세(trip_activities)
- 가이드 신청, 가이드 찾기 요청글
- 챌린지 사진 인증, 챌린지 가고싶음, 챌린지 딴지/투표
- 스폰서 방문 분쟁, 스폰서 방문 인증, 스폰서 혜택, 스폰서 매장
- 방문 국가, 프로필 확장 테이블, **프로필(profiles)**

> ⚠️ **auth.users(로그인 계정)** 는 SQL로 지우지 않습니다. 아래 2단계에서 Dashboard에서 수동 삭제해야 합니다.

---

## 2. 테스트 계정 삭제 (Authentication)

1. **Supabase Dashboard** → **Authentication** → **Users**
2. 테스트로 가입한 계정을 하나씩 선택 후 **Delete user** 로 전부 삭제

---

## 3. Storage(업로드 파일) 삭제

동행 게시글 사진, 가이드 미디어, 챌린지 인증 사진, 매장 방문 인증 사진, 아바타 등이 저장된 버킷을 비웁니다.

### 방법 A: 스크립트 실행 (권장)

```bash
node --env-file=.env.local scripts/reset-storage.mjs
```

`.env.local` 에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 가 있어야 합니다.

### 방법 B: Dashboard에서 수동 삭제

1. **Supabase Dashboard** → **Storage**
2. 버킷별로 들어가서 폴더/파일 전부 선택 후 삭제  
   - `avatars`  
   - `photos`  
   - `certifications`  
   - `guide-media`  

---

## 실행 순서 요약

1. **SQL 실행**: `reset-production-data.sql`  
2. **Authentication** 에서 테스트 유저 전부 삭제  
3. **Storage** 비우기: `scripts/reset-storage.mjs` 또는 Dashboard 수동 삭제  

이후부터는 실제 서비스용 데이터만 입력하면 됩니다.
