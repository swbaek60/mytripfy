/**
 * API Health: 주요 GET 엔드포인트 검증.
 * oauth-start: (google/apple) 200 HTML + form submit, (facebook 모바일) 302 redirect.
 * 핵심: form method="GET"은 action URL 쿼리를 무시하므로
 *       쿼리 파라미터를 hidden input으로 분해해 전달하는지 검증.
 */
import { test, expect } from '@playwright/test'

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'

/** oauth-start 응답 HTML에서 form의 구조가 올바른지 검증 */
async function assertOAuthForm(body: string, expectedProvider: string) {
  // form 존재 확인
  expect(body).toContain('id="oauthForm"')
  expect(body).toContain('method="GET"')
  expect(body).toContain('target="_self"')
  // action에는 쿼리 없는 Supabase authorize URL (쿼리는 hidden input으로)
  expect(body).toMatch(/action="https?:\/\/[^"]+\/auth\/v1\/authorize"/)
  // provider가 hidden input으로 분해됐는지 확인 (핵심)
  expect(body).toContain(`name="provider" value="${expectedProvider}"`)
  // 기타 필수 PKCE 파라미터도 hidden input으로 존재
  expect(body).toContain('name="code_challenge"')
  expect(body).toContain('name="redirect_to"')
}

test.describe('API – 공개 엔드포인트', () => {
  test('GET /api/rates 는 200을 반환한다', async ({ request }) => {
    const res = await request.get('/api/rates')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('rates')
    expect(body.rates).toHaveProperty('USD')
  })

  test('oauth-start?provider=google (모바일) → 200 + provider hidden input', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': MOBILE_UA },
    })
    expect(res.status()).toBe(200)
    await assertOAuthForm(await res.text(), 'google')
    expect(res.headers()['set-cookie']).toBeDefined()
  })

  test('oauth-start?provider=facebook (모바일) → 302 redirect (Supabase 또는 Facebook 직접)', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': MOBILE_UA },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    const loc = (res.headers()['location'] ?? '').toString()
    expect(loc).toMatch(/\/auth\/v1\/authorize|facebook\.com|fb\.com/)
    expect((res.headers()['set-cookie'] ?? '').toString()).toContain('mytripfy_oauth_locale')
  })

  test('oauth-start?provider=google (데스크톱) → 200 + provider hidden input', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': DESKTOP_UA },
    })
    expect(res.status()).toBe(200)
    await assertOAuthForm(await res.text(), 'google')
  })

  test('oauth-start?provider=apple (데스크톱) → 200 + provider hidden input', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=apple&locale=en', {
      headers: { 'User-Agent': DESKTOP_UA },
    })
    expect(res.status()).toBe(200)
    await assertOAuthForm(await res.text(), 'apple')
  })

  test('잘못된 provider 는 로그인 페이지로 리다이렉트한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=twitter&locale=en', {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toContain('/login')
  })

  test('provider 없으면 로그인 페이지로 리다이렉트한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?locale=en', {
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
    const url = 'https://example.supabase.co/auth/v1/authorize?provider=facebook&redirect_to=x&code_challenge=y&code_challenge_method=s256'
    const cookieValue = Buffer.from(url, 'utf-8').toString('base64url')
    const res = await request.get('/auth/oauth-go', {
      headers: { Cookie: `mytripfy_oauth_next=${cookieValue}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('oauthForm')
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
