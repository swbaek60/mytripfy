-- ===================================================
-- 환율 캐싱 테이블 (일 1회 업데이트)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  currency_code TEXT PRIMARY KEY,
  rate_from_usd DECIMAL(20, 8) NOT NULL DEFAULT 1,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read exchange rates" ON public.exchange_rates;
CREATE POLICY "Anyone can read exchange rates"
  ON public.exchange_rates FOR SELECT USING (true);

-- 초기 데이터 (기본값, 이후 API가 덮어씀)
INSERT INTO public.exchange_rates (currency_code, rate_from_usd) VALUES
  ('USD', 1.0),
  ('EUR', 0.92),
  ('GBP', 0.79),
  ('KRW', 1350.0),
  ('JPY', 149.0),
  ('CNY', 7.24),
  ('AUD', 1.53),
  ('SGD', 1.34),
  ('THB', 35.1),
  ('HKD', 7.82),
  ('MYR', 4.72),
  ('VND', 24500.0),
  ('CAD', 1.36),
  ('CHF', 0.90),
  ('INR', 83.1)
ON CONFLICT (currency_code) DO NOTHING;

-- ===================================================
-- 가이드 요금 통화 컬럼 추가
-- ===================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rate_currency TEXT DEFAULT 'USD';
