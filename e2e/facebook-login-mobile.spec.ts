/**
 * 소셜 로그인 (form GET + target="_self"): 새 창 없이 같은 탭에서만 이동하는지 검증.
 * - 모바일: API가 200 HTML + location.replace() 반환 → 같은 탭 유지.
 * - 데스크톱: API가 302 반환 → 같은 탭 유지.
 */
import { test, expect } from '@playwright/test'

test.describe('Facebook login', () => {
  test('클릭 시 새 창 없이 같은 탭에서만 이동한다', async ({ page, context }) => {
    await page.goto('/en/login')

    const btn = page.getByRole('button', { name: /continue with facebook/i })
    await expect(btn).toBeVisible()

    let popupOpened = false
    context.on('page', () => { popupOpened = true })

    await Promise.all([
      page.waitForURL((u) => !u.pathname.includes('/login') || u.pathname.includes('oauth-start'), { timeout: 15000 }).catch(() => {}),
      btn.click(),
    ])

    expect(popupOpened, '새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지 1개만 유지 (같은 탭 이동)').toBe(1)
  })
})

test.describe('OAuth start API', () => {
  test('모바일 User-Agent 시 200 HTML + replace 반환', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('window.location.replace')
    expect(body).toContain('Redirecting')
  })

  test('데스크톱 User-Agent 시 302 리다이렉트', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/supabase\.co|facebook\.com/)
  })
})
