-- =============================================
-- Itinerary Builder: trip_days + trip_activities
-- trip_days는 personal trip 또는 companion post 둘 다 참조 가능
-- Run in Supabase SQL Editor
-- =============================================

-- Day-by-day plan (personal trip OR companion post)
CREATE TABLE IF NOT EXISTS public.trip_days (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  post_id     uuid REFERENCES public.companion_posts(id) ON DELETE CASCADE,
  day_number  int  NOT NULL,
  date        date,
  title       text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- 반드시 trip_id 또는 post_id 중 하나만 있어야 함
  CONSTRAINT trip_days_reference CHECK (
    (trip_id IS NOT NULL AND post_id IS NULL) OR
    (trip_id IS NULL AND post_id IS NOT NULL)
  )
);

-- Partial unique indexes (NULL 값에는 UNIQUE 미적용)
CREATE UNIQUE INDEX IF NOT EXISTS trip_days_trip_id_day_uniq
  ON public.trip_days(trip_id, day_number) WHERE trip_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trip_days_post_id_day_uniq
  ON public.trip_days(post_id, day_number) WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS trip_days_trip_id_idx  ON public.trip_days(trip_id);
CREATE INDEX IF NOT EXISTS trip_days_post_id_idx  ON public.trip_days(post_id);

-- Individual activities within a day
CREATE TABLE IF NOT EXISTS public.trip_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id      uuid NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  sort_order  int  NOT NULL DEFAULT 0,
  time_label  text,
  category    text NOT NULL DEFAULT 'activity'
              CHECK (category IN ('transport','accommodation','meal','activity','note')),
  title       text NOT NULL,
  location    text,
  notes       text,
  cost        numeric(10,2),
  currency    text NOT NULL DEFAULT 'USD',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_activities_day_id_idx ON public.trip_activities(day_id, sort_order);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.trip_days       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_activities ENABLE ROW LEVEL SECURITY;

-- trip_days SELECT: 공개 trip 또는 내 trip / 공개 post 또는 내 post
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='trip_days' AND policyname='Read days of accessible trips and posts'
  ) THEN
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
  END IF;
END $$;

-- trip_days ALL (CUD): 본인 소유 trip 또는 post
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='trip_days' AND policyname='Owner manages days'
  ) THEN
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
  END IF;
END $$;

-- trip_activities SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='trip_activities' AND policyname='Read activities of accessible days'
  ) THEN
    CREATE POLICY "Read activities of accessible days"
      ON public.trip_activities FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.trip_days d WHERE d.id = day_id
        )
      );
  END IF;
END $$;

-- trip_activities ALL (CUD): 본인 소유 day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='trip_activities' AND policyname='Owner manages activities'
  ) THEN
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
  END IF;
END $$;
