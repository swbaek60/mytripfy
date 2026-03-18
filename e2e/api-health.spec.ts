/**
 * API Health: 주요 GET 엔드포인트 검증.
 * oauth-start: 모바일 UA → 302 (같은 탭 보장), 데스크톱 → 200 HTML + form submit.
 */
import { test, expect } from '@playwright/test'

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'

test.describe('API – 공개 엔드포인트', () => {
  test('GET /api/rates 는 200을 반환한다', async ({ request }) => {
    const res = await request.get('/api/rates')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('rates')
    expect(body.rates).toHaveProperty('USD')
  })

  test('GET /api/auth/oauth-start (모바일 UA) 는 200 HTML + form으로 /auth/oauth-go 이동', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': MOBILE_UA },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('oauthForm')
    expect(body).toContain('/auth/oauth-go')
    expect(res.headers()['set-cookie']).toBeDefined()
  })

  test('GET /api/auth/oauth-start?provider=facebook (모바일 UA) 는 200 HTML + form으로 oauth-go', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': MOBILE_UA },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('oauthForm')
    expect(body).toContain('/auth/oauth-go')
  })

  test('GET /api/auth/oauth-start?provider=google (데스크톱 UA) 는 200 HTML + form을 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': DESKTOP_UA },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('oauthForm')
    expect(body).toContain('form')
    expect(body).toContain('target="_self"')
  })

  test('GET /api/auth/oauth-start?provider=apple (데스크톱 UA) 는 200 HTML + form을 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=apple&locale=en', {
      headers: { 'User-Agent': DESKTOP_UA },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('oauthForm')
    expect(body).toContain('target="_self"')
  })

  test('잘못된 provider 는 로그인 페이지로 리다이렉트한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=twitter&locale=en', {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toContain('/login')
  })

  test('GET /auth/oauth-go (쿠키 없음) 는 로그인으로 리다이렉트(302/307)', async ({ request }) => {
    const res = await request.get('/auth/oauth-go', { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    expect(res.headers()['location']).toMatch(/\/login/)
  })

  test('GET /auth/oauth-go (유효한 mytripfy_oauth_next 쿠키) 는 200 HTML + form submit', async ({ request }) => {
    const url = 'https://example.supabase.co/auth/v1/authorize?provider=facebook'
    const cookieValue = Buffer.from(url, 'utf-8').toString('base64url')
    const res = await request.get('/auth/oauth-go', {
      headers: { Cookie: `mytripfy_oauth_next=${cookieValue}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('oauthForm')
    expect(body).toContain('form.submit()')
    expect(body).toContain('Redirecting')
    expect(body).toContain('target="_self"')
    expect((res.headers()['set-cookie'] ?? '').toString()).toContain('mytripfy_oauth_next')
  })
})

test.describe('API – 인증 의존 (허용 가능한 상태)', () => {
  test('GET /api/profile/completeness 는 200 또는 401을 반환한다', async ({ request }) => {
    const res = await request.get('/api/profile/completeness')
    expect([200, 401]).toContain(res.status())
  })
})
