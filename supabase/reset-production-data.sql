-- ================================================================
-- mytripfy 테스트 데이터 전체 삭제 (실서비스 전 초기화)
-- Supabase Dashboard → SQL Editor에서 실행하세요.
-- 실행 후 Authentication → Users에서 테스트 계정도 수동 삭제하세요.
-- ================================================================

BEGIN;

-- 1. dispute 투표
DELETE FROM public.dispute_votes;

-- 2. 챌린지 딴지(신고)
DELETE FROM public.challenge_disputes;

-- 3. 스폰서 방문 분쟁
DELETE FROM public.sponsor_visit_disputes;

-- 4. 스폰서 방문 인증 (매장 사진 인증)
DELETE FROM public.sponsor_visits;

-- 5. 알림
DELETE FROM public.notifications;

-- 6. 메시지
DELETE FROM public.messages;

-- 7. 채팅 참여자
DELETE FROM public.chat_participants;

-- 8. 동행 게시글 Q&A
DELETE FROM public.companion_questions;

-- 9. 동행 신청
DELETE FROM public.companion_applications;

-- 10. 리뷰
DELETE FROM public.reviews;

-- 11. 북마크
DELETE FROM public.bookmarks;

-- 12. 여행 일정 상세 (trip_activities)
DELETE FROM public.trip_activities;

-- 13. 여행 일수 (trip_days)
DELETE FROM public.trip_days;

-- 14. 여행 (trips)
DELETE FROM public.trips;

-- 15. 가이드 신청
DELETE FROM public.guide_applications;

-- 16. 가이드 찾기 요청글
DELETE FROM public.guide_requests;

-- 17. 챌린지 사진 인증
DELETE FROM public.challenge_certifications;

-- 18. 챌린지 가고싶음
DELETE FROM public.challenge_wishes;

-- 19. 스폰서 혜택 (sponsor_benefits)
DELETE FROM public.sponsor_benefits;

-- 20. 스폰서 매장
DELETE FROM public.sponsors;

-- 21. 동행 게시글의 그룹채팅 연결 해제 후 채팅방 삭제
UPDATE public.companion_posts SET group_chat_id = NULL WHERE group_chat_id IS NOT NULL;
DELETE FROM public.chats;

-- 22. 동행 찾기 게시글
DELETE FROM public.companion_posts;

-- 23. 방문 국가 (100 Countries 등)
DELETE FROM public.visited_countries;

-- 24. 프로필 확장 테이블 (있으면 삭제)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'travel_personalities') THEN
    DELETE FROM public.travel_personalities;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bucket_list') THEN
    DELETE FROM public.bucket_list;
  END IF;
END $$;

-- 25. 프로필 (auth.users는 Dashboard에서 수동 삭제)
DELETE FROM public.profiles;

COMMIT;

-- ================================================================
-- 실행 후 반드시 할 일
-- ================================================================
-- 1. Supabase Dashboard → Authentication → Users
--    → 테스트 계정 전부 삭제 (또는 하나씩 Delete user)
--
-- 2. Storage 초기화 (Dashboard 또는 아래 스크립트 사용)
--    Storage → avatars, photos, certifications, guide-media 버킷에서
--    폴더/파일 전부 삭제
-- ================================================================
