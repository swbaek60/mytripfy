/**
 * Auth: 로그인 폼·소셜 버튼·OAuth 시작·locale 유지 검증.
 */
import { test, expect } from '@playwright/test'

const LOCALE = 'en'

test.describe('Auth – 로그인 페이지', () => {
  test('로그인 페이지에 이메일·소셜 요소가 표시된다', async ({ page }) => {
    await page.goto(`/${LOCALE}/login`)
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
    // Facebook: 데스크톱은 button, 모바일은 link
    await expect(
      page.getByRole('button', { name: /continue with facebook/i }).or(
        page.getByRole('link', { name: /continue with facebook/i })
      )
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with apple/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email|@/i)).toBeVisible()
    await expect(page.getByPlaceholder(/password|•••/i)).toBeVisible()
  })

  test('다른 locale(ko) 로그인 페이지에서 Facebook에 locale=ko가 포함된다', async ({ page }) => {
    await page.goto('/ko/login')
    await expect(page.getByText(/continue with facebook/i).first()).toBeVisible()
    const form = page.locator('form').filter({ has: page.locator('input[name=provider][value=facebook]') })
    await expect(form.first()).toHaveAttribute('action', /oauth-start/)
    await expect(form.first().locator('input[name=locale]')).toHaveValue('ko')
  })
})

test.describe('Auth – OAuth 시작 API', () => {
  test('provider=facebook&locale=en 이면 200 또는 302를 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      maxRedirects: 0,
    })
    expect([200, 302]).toContain(res.status())
    if (res.status() === 302) expect(res.headers()['location']).toMatch(/supabase|facebook/)
    if (res.status() === 200) expect(await res.text()).toContain('form')
  })

  test('잘못된 provider면 로그인 페이지로 리다이렉트한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=invalid&locale=en', { maxRedirects: 0 })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/login.*Invalid|Invalid.*provider/)
  })

  test('모바일 UA 시 200 + form to provider와 locale 쿠키를 반환한다', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=ko', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 15; wv) Chrome/131.0.0.0 Mobile Safari/537.36' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('id="oauthForm"')
    expect(body).toMatch(/action="[^"]*(\/auth\/v1\/authorize|facebook\.com|fb\.com)/)
    expect(res.headers()['set-cookie']).toContain('mytripfy_oauth_locale')
  })
})

test.describe('Auth – 소셜 버튼 클릭 시 새 창 미오픈', () => {
  test('Facebook 버튼 클릭 시 같은 탭에서만 이동한다', async ({ page, context }) => {
    await page.goto(`/${LOCALE}/login`)
    let popupOpened = false
    context.on('page', () => { popupOpened = true })
    const fb = page.getByRole('button', { name: /continue with facebook/i })
    await fb.click()
    await page.waitForTimeout(2000)
    expect(popupOpened).toBe(false)
    expect(context.pages().length).toBe(1)
  })
})
