-- 100 Museums를 정확히 100개로 맞추기: 제일 덜 유명한 1건 제거 (Abderrahman Slaoui Foundation Museum)
-- 실행: Supabase SQL Editor에서 실행하거나 마이그레이션으로 적용
DELETE FROM public.challenges
WHERE category = 'museums' AND title_en = 'Abderrahman Slaoui Foundation Museum';
