-- 성능 보강: 외래키 인덱스 + 자주 쓰는 조회 경로 복합 인덱스
--
-- 인덱스 없는 외래키는 부모 행을 지울 때마다 자식 테이블 전체를 스캔하고,
-- 조인에서도 매번 seq scan 이 된다. 21개 외래키가 인덱스 없이 남아 있었다.

create index if not exists idx_challenge_certifications_challenge_id on public.challenge_certifications (challenge_id);
create index if not exists idx_challenge_disputes_reporter_id on public.challenge_disputes (reporter_id);
create index if not exists idx_chat_participants_user_id on public.chat_participants (user_id);
create index if not exists idx_chats_created_by on public.chats (created_by);
create index if not exists idx_companion_applications_applicant_id on public.companion_applications (applicant_id);
create index if not exists idx_companion_posts_user_id on public.companion_posts (user_id);
create index if not exists idx_companion_posts_group_chat_id on public.companion_posts (group_chat_id);
create index if not exists idx_companion_questions_post_id on public.companion_questions (post_id);
create index if not exists idx_companion_questions_question_user_id on public.companion_questions (question_user_id);
create index if not exists idx_companion_questions_answer_user_id on public.companion_questions (answer_user_id);
create index if not exists idx_dispute_votes_voter_id on public.dispute_votes (voter_id);
create index if not exists idx_guide_applications_guide_id on public.guide_applications (guide_id);
create index if not exists idx_guide_requests_user_id on public.guide_requests (user_id);
create index if not exists idx_messages_sender_id on public.messages (sender_id);
create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_profiles_referred_by on public.profiles (referred_by);
create index if not exists idx_reviews_post_id on public.reviews (post_id);
create index if not exists idx_reviews_reviewee_id on public.reviews (reviewee_id);
create index if not exists idx_sponsor_visits_benefit_id on public.sponsor_visits (benefit_id);
create index if not exists idx_sponsor_visits_reviewed_by on public.sponsor_visits (reviewed_by);

-- 핫 경로 복합 인덱스
-- 채팅방 열기: chat_id 로 필터 + created_at 정렬 (messages_chat_id_fkey 도 이 인덱스로 커버된다)
create index if not exists idx_messages_chat_id_created_at on public.messages (chat_id, created_at);
-- 헤더 배지: 사용자별 안 읽은 알림만 센다
create index if not exists idx_notifications_user_unread on public.notifications (user_id, created_at desc) where is_read = false;
-- 참가 여부 확인 (모든 채팅 API 가 첫 단계로 호출한다)
create index if not exists idx_chat_participants_chat_user on public.chat_participants (chat_id, user_id);
-- 모집글 상세: 수락된 신청자 목록
create index if not exists idx_companion_applications_post_status on public.companion_applications (post_id, status);
-- 일정 편집기: 여행/모집글의 날짜 순 조회
create index if not exists idx_trip_days_trip_day on public.trip_days (trip_id, day_number);
create index if not exists idx_trip_days_post_day on public.trip_days (post_id, day_number);
create index if not exists idx_trip_activities_day_order on public.trip_activities (day_id, sort_order);

-- 함수 search_path 고정
-- search_path 가 열려 있으면 호출자가 스키마를 앞에 끼워 넣어 함수 내부의
-- 테이블 참조를 가로챌 수 있다 (권한 상승 경로).
alter function public.sponsor_visit_delete_points() set search_path = public, pg_temp;
