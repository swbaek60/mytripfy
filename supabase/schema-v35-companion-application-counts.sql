-- ============================================================
-- v35: 동행 게시글별 신청 수를 공개 조회할 수 있는 뷰
-- 리스트 페이지에서 익명/비소유자도 신청 수를 표시하기 위함
-- (기본 security definer로 뷰 소유자 권한으로 조회 → RLS 우회)
-- ============================================================

CREATE OR REPLACE VIEW public.companion_post_application_counts AS
SELECT post_id, COUNT(*)::int AS count
FROM public.companion_applications
GROUP BY post_id;

-- anon, authenticated 역할에 SELECT 권한 부여
GRANT SELECT ON public.companion_post_application_counts TO anon;
GRANT SELECT ON public.companion_post_application_counts TO authenticated;
