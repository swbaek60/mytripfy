-- =============================================
-- Trip Planner: trips table & policies
-- Run this in Supabase SQL Editor (or via migration)
-- =============================================

-- Enable pgcrypto for gen_random_uuid if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  destination_country text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Basic index for dashboard queries
CREATE INDEX IF NOT EXISTS trips_user_id_start_date_idx
  ON public.trips (user_id, start_date DESC);

-- Keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_trips_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trips_updated_at ON public.trips;
CREATE TRIGGER set_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.set_trips_updated_at();

-- RLS: only owner can manage, public can view public trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Allow everyone (incl. anonymous) to view public trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'trips'
      AND policyname = 'Public can read public trips'
  ) THEN
    CREATE POLICY "Public can read public trips"
      ON public.trips
      FOR SELECT
      USING (visibility = 'public');
  END IF;
END $$;

-- Authenticated users: full CRUD on own trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'trips'
      AND policyname = 'Users can manage their own trips'
  ) THEN
    CREATE POLICY "Users can manage their own trips"
      ON public.trips
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

