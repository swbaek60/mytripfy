/**
 * API Health: 주요 GET 엔드포인트가 기대 상태를 반환하는지 검증.
 */
import { test, expect } from '@playwright/test'

test.describe('API – 공개 엔드포인트', () => {
  test('GET /api/rates 는 200을 반환한다', async ({ request }) => {
    const res = await request.get('/api/rates')
    expect(res.status()).toBe(200)
  })

  test('GET /api/auth/oauth-start?provider=facebook&locale=en (데스크톱 UA) 는 302를 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/supabase\.co|facebook\.com/)
  })

  test('GET /api/auth/oauth-start?provider=google&locale=en (데스크톱 UA) 는 302를 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/supabase|google/)
  })

  test('GET /api/auth/oauth-start?provider=apple&locale=en (데스크톱 UA) 는 302를 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=apple&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/supabase|apple/)
  })
})

test.describe('API – 인증 의존 (허용 가능한 상태)', () => {
  test('GET /api/profile/completeness 는 200 또는 401을 반환한다', async ({ request }) => {
    const res = await request.get('/api/profile/completeness')
    expect([200, 401]).toContain(res.status())
  })
})
