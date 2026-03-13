-- v5: 가이드 차량/숙소 사진 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guide_vehicle_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS guide_accommodation_photos TEXT[] DEFAULT '{}';
