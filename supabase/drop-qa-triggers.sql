-- Q&A 알림 DB 트리거 제거
-- 알림 생성은 QuestionsSection.tsx 클라이언트 코드에서 처리하므로
-- DB 트리거가 있으면 중복 알림이 발생함

DROP TRIGGER IF EXISTS on_new_question ON public.companion_questions;
DROP FUNCTION IF EXISTS public.notify_on_new_question();

DROP TRIGGER IF EXISTS on_new_answer ON public.companion_questions;
DROP FUNCTION IF EXISTS public.notify_on_new_answer();
