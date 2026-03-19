/**
 * API Health: 주요 공개 엔드포인트 상태 검증.
 * OAuth 소셜 로그인 상세 검증은 oauth-flow.spec.ts 에 있습니다.
 */
import { test, expect } from '@playwright/test'

test.describe('API – 공개 엔드포인트', () => {
  test('GET /api/rates → 200 + rates.USD 존재', async ({ request }) => {
    const res = await request.get('/api/rates')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('rates')
    expect(body.rates).toHaveProperty('USD')
  })

  test('GET /auth/oauth-go (쿠키 없음) → 302/307 + /login', async ({ request }) => {
    const res = await request.get('/auth/oauth-go', { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    expect(res.headers()['location']).toMatch(/\/login/)
  })

  test('GET /auth/oauth-go (유효한 mytripfy_oauth_next 쿠키) → 200 + form', async ({ request }) => {
    const url = 'https://example.supabase.co/auth/v1/authorize?provider=facebook&redirect_to=x&code_challenge=y&code_challenge_method=s256'
    const cookieValue = Buffer.from(url, 'utf-8').toString('base64url')
    const res = await request.get('/auth/oauth-go', {
      headers: { Cookie: `mytripfy_oauth_next=${cookieValue}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('oauthForm')
    expect(body).toContain('target="_self"')
    expect((res.headers()['set-cookie'] ?? '').toString()).toContain('mytripfy_oauth_next')
  })
})

test.describe('API – 인증 의존 (허용 가능한 상태)', () => {
  test('GET /api/profile/completeness → 200 또는 401', async ({ request }) => {
    const res = await request.get('/api/profile/completeness')
    expect([200, 401]).toContain(res.status())
  })
})
