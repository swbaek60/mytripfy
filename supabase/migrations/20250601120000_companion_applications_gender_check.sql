-- 동행 신청 INSERT 시 성별 조건 검사: 여성만/남성만 게시글은 프로필 성별이 일치할 때만 신청 가능
DROP POLICY IF EXISTS "applications_insert" ON public.companion_applications;

CREATE POLICY "applications_insert" ON public.companion_applications
FOR INSERT
WITH CHECK (
  auth.uid() = applicant_id
  AND EXISTS (
    SELECT 1
    FROM public.companion_posts p
    INNER JOIN public.profiles pr ON pr.id = applicant_id
    WHERE p.id = post_id
    AND (
      p.gender_preference = 'any'
      OR (p.gender_preference = 'female_only' AND pr.gender = 'female')
      OR (p.gender_preference = 'male_only' AND pr.gender = 'male')
    )
  )
);
