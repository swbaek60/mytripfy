/**
 * API Health: 주요 GET 엔드포인트가 기대 상태를 반환하는지 검증.
 * oauth-start는 이제 모든 UA에서 200 HTML을 반환 (새 창 방지를 위해 form submit 방식 통일).
 */
import { test, expect } from '@playwright/test'

test.describe('API – 공개 엔드포인트', () => {
  test('GET /api/rates 는 200을 반환한다', async ({ request }) => {
    const res = await request.get('/api/rates')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('rates')
    expect(body.rates).toHaveProperty('USD')
  })

  test('GET /api/auth/oauth-start?provider=google (모바일 UA) 는 200 HTML을 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('form')
    expect(body).toContain('target="_self"')
    expect(body).toContain('supabase')
  })

  test('GET /api/auth/oauth-start?provider=google (데스크톱 UA) 는 200 HTML을 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('form')
    expect(body).toContain('target="_self"')
  })

  test('GET /api/auth/oauth-start?provider=facebook (모바일 UA) 는 200 HTML을 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('form')
    expect(body).toContain('target="_self"')
    expect(body).toContain('supabase')
  })

  test('GET /api/auth/oauth-start?provider=apple (데스크톱 UA) 는 200 HTML을 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=apple&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('form')
    expect(body).toContain('target="_self"')
  })

  test('잘못된 provider 는 로그인 페이지로 리다이렉트한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=twitter&locale=en', {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toContain('/login')
  })
})

test.describe('API – 인증 의존 (허용 가능한 상태)', () => {
  test('GET /api/profile/completeness 는 200 또는 401을 반환한다', async ({ request }) => {
    const res = await request.get('/api/profile/completeness')
    expect([200, 401]).toContain(res.status())
  })
})
