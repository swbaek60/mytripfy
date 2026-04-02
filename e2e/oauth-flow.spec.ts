/**
 * Clerk 전환 이후: 레거시 Supabase OAuth 라우트(410/리다이렉트)와
 * session-pickup·BroadcastChannel 보조 흐름만 검증합니다.
 */
import { test, expect } from '@playwright/test'

test.describe('Deprecated Supabase OAuth API', () => {
  test('GET /api/auth/oauth-start → 410 + Clerk 안내 JSON', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/131.0' },
    })
    expect(res.status()).toBe(410)
    const j = (await res.json()) as { error?: string }
    expect(j.error ?? '').toMatch(/Clerk|sign-in/i)
  })

  test('GET /auth/callback → /sign-in 로 리다이렉트', async ({ request }) => {
    const res = await request.get('/auth/callback?locale=en', { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    const loc = res.headers().location ?? ''
    expect(loc).toMatch(/sign-in/i)
  })
})

test.describe('auth/session-pickup', () => {
  test('token 없으면 로그인 경로로 리다이렉트', async ({ request }) => {
    const res = await request.get('/auth/session-pickup', { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    expect(res.headers().location ?? '').toMatch(/login/)
  })

  test('잘못된 token이면 로그인 경로로 리다이렉트', async ({ request }) => {
    const res = await request.get('/auth/session-pickup?token=invalid-token', { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    expect(res.headers().location ?? '').toMatch(/login/)
  })
})
