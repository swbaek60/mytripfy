/** Jest 전역 설정 – API 라우트 테스트 시 env 기본값 (실제 값은 .env에서 덮어씀) */
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
}
if (!process.env.NEXT_PUBLIC_ANON_KEY) {
  process.env.NEXT_PUBLIC_ANON_KEY = 'test-anon-key'
}
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.mytripfy.com'
}
