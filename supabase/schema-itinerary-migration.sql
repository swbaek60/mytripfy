-- =============================================
-- Migration: trip_days에 post_id 컬럼 추가
-- 이미 schema-itinerary.sql을 실행한 경우 이 파일을 실행하세요
-- Run in Supabase SQL Editor
-- =============================================

-- 1. post_id 컬럼 추가 (없으면 추가)
ALTER TABLE public.trip_days
  ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES public.companion_posts(id) ON DELETE CASCADE;

-- 2. 기존 trip_id NOT NULL 제약 제거
ALTER TABLE public.trip_days
  ALTER COLUMN trip_id DROP NOT NULL;

-- 3. CHECK 제약 추가 (trip_id 또는 post_id 중 하나만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trip_days_reference' AND conrelid = 'public.trip_days'::regclass
  ) THEN
    ALTER TABLE public.trip_days
      ADD CONSTRAINT trip_days_reference CHECK (
        (trip_id IS NOT NULL AND post_id IS NULL) OR
        (trip_id IS NULL AND post_id IS NOT NULL)
      );
  END IF;
END $$;

-- 4. 기존 UNIQUE 제약/인덱스 제거 후 Partial unique index로 교체
ALTER TABLE public.trip_days
  DROP CONSTRAINT IF EXISTS trip_days_trip_id_day_number_key;

DROP INDEX IF EXISTS public.trip_days_trip_id_day_uniq;
DROP INDEX IF EXISTS public.trip_days_post_id_day_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS trip_days_trip_id_day_uniq
  ON public.trip_days(trip_id, day_number) WHERE trip_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trip_days_post_id_day_uniq
  ON public.trip_days(post_id, day_number) WHERE post_id IS NOT NULL;

-- 5. post_id 인덱스 추가
CREATE INDEX IF NOT EXISTS trip_days_post_id_idx ON public.trip_days(post_id);

-- 6. RLS 정책 업데이트
DROP POLICY IF EXISTS "Read days of public trips"             ON public.trip_days;
DROP POLICY IF EXISTS "Owner manages days"                    ON public.trip_days;
DROP POLICY IF EXISTS "Read days of accessible trips and posts" ON public.trip_days;

CREATE POLICY "Read days of accessible trips and posts"
  ON public.trip_days FOR SELECT
  USING (
    (trip_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id
        AND (t.visibility = 'public' OR t.user_id = auth.uid())
    ))
    OR
    (post_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.companion_posts p
      WHERE p.id = post_id
    ))
  );

CREATE POLICY "Owner manages days"
  ON public.trip_days FOR ALL TO authenticated
  USING (
    (trip_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()
    ))
    OR
    (post_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.companion_posts p WHERE p.id = post_id AND p.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    (trip_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()
    ))
    OR
    (post_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.companion_posts p WHERE p.id = post_id AND p.user_id = auth.uid()
    ))
  );

-- 7. trip_activities RLS도 업데이트
DROP POLICY IF EXISTS "Read activities of public trips"    ON public.trip_activities;
DROP POLICY IF EXISTS "Owner manages activities"           ON public.trip_activities;
DROP POLICY IF EXISTS "Read activities of accessible days" ON public.trip_activities;

CREATE POLICY "Read activities of accessible days"
  ON public.trip_activities FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.trip_days d WHERE d.id = day_id)
  );

CREATE POLICY "Owner manages activities"
  ON public.trip_activities FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_days d
      WHERE d.id = day_id
        AND (
          (d.trip_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.trips t WHERE t.id = d.trip_id AND t.user_id = auth.uid()
          ))
          OR
          (d.post_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.companion_posts p WHERE p.id = d.post_id AND p.user_id = auth.uid()
          ))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_days d
      WHERE d.id = day_id
        AND (
          (d.trip_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.trips t WHERE t.id = d.trip_id AND t.user_id = auth.uid()
          ))
          OR
          (d.post_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.companion_posts p WHERE p.id = d.post_id AND p.user_id = auth.uid()
          ))
        )
    )
  );
