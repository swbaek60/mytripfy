/**
 * 소셜 로그인: 같은 탭만 사용, locale 유지, 모바일/데스크톱 검증.
 */
import { test, expect } from '@playwright/test'

test.describe('Facebook login UI', () => {
  test('클릭 시 새 창 없이 같은 탭에서만 이동한다', async ({ page, context }) => {
    await page.goto('/en/login')

    const link = page.getByRole('link', { name: /continue with facebook/i })
    await expect(link).toBeVisible()

    let popupOpened = false
    context.on('page', () => { popupOpened = true })

    await Promise.all([
      page.waitForURL((u) => !u.pathname.includes('/login') || u.pathname.includes('oauth-start'), { timeout: 15000 }).catch(() => {}),
      link.click(),
    ])

    expect(popupOpened, '새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지 1개만 유지').toBe(1)
  })

  test('다른 locale 로그인 페이지에서 링크에 locale이 포함된다', async ({ page }) => {
    await page.goto('/ko/login')
    const link = page.getByRole('link', { name: /continue with facebook/i })
    await expect(link).toHaveAttribute('href', /locale=ko/)
  })
})

test.describe('OAuth start API', () => {
  test('모바일 User-Agent 시 200 HTML + replace + locale 쿠키', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=ko', {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('window.location.replace')
    expect(body).toContain('window.top')
    const setCookie = res.headers()['set-cookie']
    expect(setCookie).toBeDefined()
    expect(setCookie).toContain('mytripfy_oauth_locale')
    expect(setCookie).toMatch(/ko|%EC%BD%94/) // ko or encoded
  })

  test('데스크톱 User-Agent 시 302 + locale 쿠키', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=ja', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/supabase\.co|facebook\.com/)
    const setCookie = res.headers()['set-cookie']
    expect(setCookie).toContain('mytripfy_oauth_locale')
  })
})

test.describe('모바일 뷰포트', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true })

  test('Facebook 링크 탭 시 새 창이 열리지 않는다', async ({ page, context }) => {
    await page.goto('/en/login')
    const link = page.getByRole('link', { name: /continue with facebook/i })
    await expect(link).toBeVisible()

    const pageCountBefore = context.pages().length
    let newPageOpened = false
    context.on('page', () => { newPageOpened = true })

    await link.click()
    await page.waitForTimeout(1500)

    expect(newPageOpened, '모바일에서 새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지 수 유지').toBe(pageCountBefore)
  })
})
