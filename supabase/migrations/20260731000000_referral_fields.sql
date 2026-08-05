-- User referral loop (mirrors remote apply_migration add_referral_fields)
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null,
  add column if not exists referral_count integer not null default 0;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

update public.profiles
set referral_code = lower(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;
