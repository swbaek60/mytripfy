-- =============================================
-- mytripfy Database Schema
-- Supabase SQL Editor 에서 실행하세요
-- =============================================

-- 프로필 테이블 (auth.users 와 1:1 연결)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  birth_year INTEGER,
  nationality TEXT,
  bio TEXT,
  avatar_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  whatsapp TEXT,
  line_id TEXT,
  wechat_id TEXT,
  telegram TEXT,
  website_url TEXT,
  -- 가이드 설정
  is_guide BOOLEAN DEFAULT FALSE,
  guide_hourly_rate DECIMAL(10,2),  -- USD, NULL 또는 0 = 무료
  guide_has_vehicle BOOLEAN DEFAULT FALSE,
  guide_vehicle_info TEXT,
  guide_has_accommodation BOOLEAN DEFAULT FALSE,
  guide_accommodation_info TEXT,
  guide_regions TEXT[],
  guide_languages TEXT[],
  -- 통계 (트리거로 자동 업데이트)
  travel_count INTEGER DEFAULT 0,
  travel_level INTEGER DEFAULT 1,
  trust_score DECIMAL(3,2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  -- 인증 뱃지
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  sns_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 방문 국가 테이블
CREATE TABLE IF NOT EXISTS public.visited_countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT,
  visited_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

-- 동행 모집 게시글
CREATE TABLE IF NOT EXISTS public.companion_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  destination_city TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_people INTEGER DEFAULT 2,
  gender_preference TEXT DEFAULT 'any' CHECK (gender_preference IN ('any', 'male_only', 'female_only')),
  purpose TEXT,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 동행 신청
CREATE TABLE IF NOT EXISTS public.companion_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.companion_posts(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, applicant_id)
);

-- 리뷰 테이블
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  review_type TEXT CHECK (review_type IN ('companion', 'guide')) NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, reference_id)
);

-- 채팅방
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('companion', 'guide', 'direct')) NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅방 참여자
CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

-- 메시지
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip Q&A: 질문/답변 구조
CREATE TABLE IF NOT EXISTS public.companion_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.companion_posts(id) ON DELETE CASCADE NOT NULL,
  -- 질문 작성자 (신청자/일반 사용자)
  question_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_content TEXT NOT NULL,
  question_created_at TIMESTAMPTZ DEFAULT NOW(),
  -- 호스트 답변
  answer_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_content TEXT,
  answer_created_at TIMESTAMPTZ
);

-- =============================================
-- Row Level Security (RLS) 보안 정책
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visited_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_questions ENABLE ROW LEVEL SECURITY;

-- 프로필: 누구나 볼 수 있고, 본인만 수정 가능
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 방문 국가: 누구나 볼 수 있고, 본인만 관리
CREATE POLICY "visited_countries_select" ON public.visited_countries FOR SELECT USING (true);
CREATE POLICY "visited_countries_insert" ON public.visited_countries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "visited_countries_delete" ON public.visited_countries FOR DELETE USING (auth.uid() = user_id);

-- 동행 게시글: 누구나 볼 수 있고, 본인만 수정
CREATE POLICY "companion_posts_select" ON public.companion_posts FOR SELECT USING (true);
CREATE POLICY "companion_posts_all" ON public.companion_posts FOR ALL USING (auth.uid() = user_id);

-- 동행 신청: 게시글 주인과 신청자만 볼 수 있음
CREATE POLICY "applications_select" ON public.companion_applications FOR SELECT
  USING (auth.uid() = applicant_id OR auth.uid() IN (
    SELECT user_id FROM public.companion_posts WHERE id = post_id
  ));
CREATE POLICY "applications_insert" ON public.companion_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "applications_update" ON public.companion_applications FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.companion_posts WHERE id = post_id));

-- 리뷰: 누구나 볼 수 있음
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 채팅: 참여자만 접근
CREATE POLICY "chats_select" ON public.chats FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.chat_participants WHERE chat_id = id));

-- 새 채팅방 생성: 인증된 사용자면 누구나 가능
CREATE POLICY "chats_insert" ON public.chats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "chat_participants_select" ON public.chat_participants FOR SELECT USING (auth.uid() = user_id);

-- 채팅방 참가자 추가:
-- 1) 본인이 자기 자신을 추가할 때
-- 2) 이미 그 채팅방 참가자인 사용자가 다른 참가자를 추가할 때
DROP POLICY IF EXISTS "chat_participants_insert" ON public.chat_participants;
CREATE POLICY "chat_participants_insert" ON public.chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM public.chat_participants WHERE chat_id = chat_participants.chat_id
    )
  );
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.chat_participants WHERE chat_id = messages.chat_id));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND auth.uid() IN (
    SELECT user_id FROM public.chat_participants WHERE chat_id = messages.chat_id
  ));

-- Trip Q&A: 질문은 누구나, 답변은 호스트만
CREATE POLICY "companion_questions_select" ON public.companion_questions FOR SELECT
  USING (true);

CREATE POLICY "companion_questions_insert" ON public.companion_questions FOR INSERT
  WITH CHECK (auth.uid() = question_user_id);

-- 호스트만 answer_* 필드 업데이트 가능
CREATE POLICY "companion_questions_update_answer" ON public.companion_questions FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM public.companion_posts WHERE id = post_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.companion_posts WHERE id = post_id
  ));

-- =============================================
-- 트리거: 회원가입 시 자동으로 프로필 생성
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email_verified)
  VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 트리거: 방문 국가 수에 따라 여행 레벨 자동 업데이트
-- =============================================
CREATE OR REPLACE FUNCTION public.update_travel_level()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
  v_level INTEGER;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  SELECT COUNT(*) INTO v_count FROM public.visited_countries WHERE user_id = v_user_id;

  v_level := CASE
    WHEN v_count >= 50 THEN 10
    WHEN v_count >= 40 THEN 9
    WHEN v_count >= 30 THEN 8
    WHEN v_count >= 25 THEN 7
    WHEN v_count >= 20 THEN 6
    WHEN v_count >= 15 THEN 5
    WHEN v_count >= 10 THEN 4
    WHEN v_count >= 6  THEN 3
    WHEN v_count >= 3  THEN 2
    ELSE 1
  END;

  UPDATE public.profiles
  SET travel_count = v_count, travel_level = v_level, updated_at = NOW()
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_visited_country_change ON public.visited_countries;
CREATE TRIGGER on_visited_country_change
  AFTER INSERT OR DELETE ON public.visited_countries
  FOR EACH ROW EXECUTE FUNCTION public.update_travel_level();

-- =============================================
-- 트리거: 리뷰 등록 시 신뢰도 점수 자동 업데이트
-- =============================================
CREATE OR REPLACE FUNCTION public.update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    trust_score = (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE reviewed_id = NEW.reviewed_id),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE reviewed_id = NEW.reviewed_id),
    updated_at = NOW()
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_trust_score();
