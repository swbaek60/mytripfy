-- =============================================
-- mytripfy 챌린지 도장깨기 기능 테이블 및 트리거
-- Supabase SQL Editor 에서 실행하세요
-- =============================================

-- 1. profiles 테이블에 챌린지 점수 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS challenge_points INTEGER DEFAULT 0;

-- 2. 챌린지 목록 테이블
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('attractions', 'foods', 'golf', 'countries', 'restaurants', 'animals', 'festivals', 'nature')),
  title_ko TEXT NOT NULL,
  title_en TEXT NOT NULL,
  country_code TEXT,
  description_ko TEXT,
  description_en TEXT,
  image_url TEXT,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 유저 챌린지 인증 내역 테이블
CREATE TABLE IF NOT EXISTS public.challenge_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id) -- 한 챌린지는 한 번만 인증 가능
);

-- 4. RLS 정책
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_certifications ENABLE ROW LEVEL SECURITY;

-- challenges: 누구나 조회 가능, 쓰기는 관리자만(일단은 모두 닫고 Supabase UI에서만 제어하도록 하거나 SELECT만 허용)
CREATE POLICY "challenges_select" ON public.challenges FOR SELECT USING (true);

-- challenge_certifications: 누구나 조회 가능, 본인만 생성/수정/삭제
CREATE POLICY "challenge_certifications_select" ON public.challenge_certifications FOR SELECT USING (true);
CREATE POLICY "challenge_certifications_insert" ON public.challenge_certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "challenge_certifications_update" ON public.challenge_certifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "challenge_certifications_delete" ON public.challenge_certifications FOR DELETE USING (auth.uid() = user_id);

-- 5. 챌린지 인증 시 프로필 점수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_challenge_points()
RETURNS TRIGGER AS $$
DECLARE
  earned_points INTEGER;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT points INTO earned_points FROM public.challenges WHERE id = NEW.challenge_id;
    UPDATE public.profiles SET challenge_points = challenge_points + earned_points WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT points INTO earned_points FROM public.challenges WHERE id = OLD.challenge_id;
    UPDATE public.profiles SET challenge_points = challenge_points - earned_points WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_certification_change ON public.challenge_certifications;
CREATE TRIGGER on_certification_change
  AFTER INSERT OR DELETE ON public.challenge_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_points();

-- 6. 초기 샘플 데이터 삽입 (각 카테고리별 일부)
INSERT INTO public.challenges (category, title_ko, title_en, country_code, points, description_en) VALUES
  ('attractions', '에펠탑', 'Eiffel Tower', 'FR', 10, 'The iconic wrought-iron lattice tower on the Champ de Mars in Paris.'),
  ('attractions', '마추픽추', 'Machu Picchu', 'PE', 15, 'A 15th-century Inca citadel located in the Eastern Cordillera of southern Peru.'),
  ('attractions', '만리장성', 'Great Wall of China', 'CN', 10, 'A series of fortifications that were built across the historical northern borders of ancient Chinese states.'),
  ('foods', '나폴리 피자', 'Neapolitan Pizza', 'IT', 5, 'A style of pizza made with tomatoes and mozzarella cheese originating from Naples.'),
  ('foods', '똠양꿍', 'Tom Yum Goong', 'TH', 5, 'A type of hot and sour Thai soup, usually cooked with shrimp.'),
  ('golf', '세인트 앤드류스', 'St Andrews Links', 'GB', 20, 'The historic Home of Golf, where the game was first played in the early 15th century.'),
  ('golf', '오거스타 내셔널', 'Augusta National', 'US', 20, 'One of the most famous and exclusive golf clubs in the world, host of the Masters.'),
  ('animals', '아프리카 사파리 빅5', 'Big Five Game', 'ZA', 20, 'Lion, leopard, rhinoceros, elephant, and Cape buffalo.'),
  ('animals', '쿼카', 'Quokka', 'AU', 10, 'A small macropod about the size of a domestic cat, found on some smaller islands off the coast of Western Australia.'),
  ('festivals', '옥토버페스트', 'Oktoberfest', 'DE', 15, 'The world''s largest Volksfest, featuring a beer festival and a travelling funfair.'),
  ('festivals', '리우 카니발', 'Rio Carnival', 'BR', 15, 'A festival held every year before Lent and considered the biggest carnival in the world.'),
  ('nature', '그랜드 캐년', 'Grand Canyon', 'US', 10, 'A steep-sided canyon carved by the Colorado River in Arizona.'),
  ('nature', '파타고니아 트레킹', 'Patagonia Trekking', 'AR', 20, 'Trekking in the sparsely populated region at the southern end of South America.')
ON CONFLICT DO NOTHING;
