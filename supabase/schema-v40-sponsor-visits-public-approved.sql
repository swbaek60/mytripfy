-- ============================================================
-- v40: 스폰서 방문 인증(approved)은 타인 프로필에서 공개
-- 기존: 본인·매장 소유자만 읽기 → 추가: status = 'approved' 이면 누구나 읽기
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

CREATE POLICY "sponsor_visits_select_approved_public" ON public.sponsor_visits
  FOR SELECT USING (status = 'approved');
