-- ============================================================
-- v37: Sponsors - 매장/업체 홍보 + 혜택(쿠폰) + 방문 인증 포인트
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. sponsors: 매장/업체 (식당, 카페, 점포 등)
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  business_type TEXT NOT NULL CHECK (business_type IN (
    'restaurant', 'cafe', 'bar', 'shop', 'accommodation', 'experience', 'other'
  )),
  country_code TEXT NOT NULL,
  region TEXT,
  city TEXT,
  address TEXT,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  website_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_user_id ON public.sponsors(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_country ON public.sponsors(country_code);
CREATE INDEX IF NOT EXISTS idx_sponsors_business_type ON public.sponsors(business_type);
CREATE INDEX IF NOT EXISTS idx_sponsors_status ON public.sponsors(status);

-- 2. sponsor_benefits: 혜택/쿠폰 (기간·지역·조건 등)
CREATE TABLE IF NOT EXISTS public.sponsor_benefits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  terms TEXT,
  benefit_type TEXT NOT NULL CHECK (benefit_type IN (
    'discount_percent', 'discount_fixed', 'free_item', 'free_drink', 'free_entry', 'bogo', 'other'
  )),
  value_num INTEGER,
  value_text TEXT,
  currency TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  country_code TEXT,
  region TEXT,
  max_redemptions INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_benefits_sponsor ON public.sponsor_benefits(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_benefits_dates ON public.sponsor_benefits(start_date, end_date);

-- 3. sponsor_visits: 방문 인증 (사진 업로드 → 승인 시 포인트)
CREATE TABLE IF NOT EXISTS public.sponsor_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES public.sponsor_benefits(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  points_granted INTEGER DEFAULT 0,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매장당 사용자 1회 방문 인증 (중복 포인트 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sponsor_visits_user_sponsor
  ON public.sponsor_visits(user_id, sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visits_user ON public.sponsor_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visits_sponsor ON public.sponsor_visits(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visits_status ON public.sponsor_visits(status);

-- 4. RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_visits ENABLE ROW LEVEL SECURITY;

-- sponsors: 공개 읽기, 소유자만 수정/삭제/추가
CREATE POLICY "sponsors_select" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "sponsors_insert" ON public.sponsors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sponsors_update" ON public.sponsors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sponsors_delete" ON public.sponsors FOR DELETE USING (auth.uid() = user_id);

-- sponsor_benefits: 공개 읽기, 해당 sponsor 소유자만 수정
CREATE POLICY "sponsor_benefits_select" ON public.sponsor_benefits FOR SELECT USING (true);
CREATE POLICY "sponsor_benefits_insert" ON public.sponsor_benefits FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.sponsors WHERE id = sponsor_id));
CREATE POLICY "sponsor_benefits_update" ON public.sponsor_benefits FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.sponsors WHERE id = sponsor_id));
CREATE POLICY "sponsor_benefits_delete" ON public.sponsor_benefits FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.sponsors WHERE id = sponsor_id));

-- sponsor_visits: 본인/매장 소유자/관리자만 읽기, 본인만 insert
CREATE POLICY "sponsor_visits_select" ON public.sponsor_visits FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT user_id FROM public.sponsors WHERE id = sponsor_id)
  );
CREATE POLICY "sponsor_visits_insert" ON public.sponsor_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sponsor_visits_update" ON public.sponsor_visits FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT user_id FROM public.sponsors WHERE id = sponsor_id)
  );

-- 5. 방문 승인 시 profiles.challenge_points 증가 트리거
CREATE OR REPLACE FUNCTION public.sponsor_visit_approve_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') AND NEW.points_granted > 0 THEN
    UPDATE public.profiles SET challenge_points = COALESCE(challenge_points, 0) + NEW.points_granted WHERE id = NEW.user_id;
  ELSIF OLD.status = 'approved' AND NEW.status <> 'approved' AND OLD.points_granted > 0 THEN
    UPDATE public.profiles SET challenge_points = GREATEST(COALESCE(challenge_points, 0) - OLD.points_granted, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sponsor_visit_approve ON public.sponsor_visits;
CREATE TRIGGER on_sponsor_visit_approve
  AFTER INSERT OR UPDATE OF status, points_granted ON public.sponsor_visits
  FOR EACH ROW EXECUTE FUNCTION public.sponsor_visit_approve_points();

-- 6. updated_at 트리거
CREATE OR REPLACE FUNCTION public.sponsors_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sponsors_updated_at ON public.sponsors;
CREATE TRIGGER sponsors_updated_at BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.sponsors_updated_at();

CREATE OR REPLACE FUNCTION public.sponsor_benefits_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sponsor_benefits_updated_at ON public.sponsor_benefits;
CREATE TRIGGER sponsor_benefits_updated_at BEFORE UPDATE ON public.sponsor_benefits FOR EACH ROW EXECUTE FUNCTION public.sponsor_benefits_updated_at();
