-- 사용자별 선호 언어 저장 (로그인 시 해당 언어로 리다이렉트)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT DEFAULT 'en';

COMMENT ON COLUMN public.profiles.preferred_locale IS 'UI 표시용 선호 로케일 (en, ko, ja 등). 로그인 후 이 언어로 리다이렉트.';
