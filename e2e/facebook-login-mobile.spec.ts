/**
 * 소셜 로그인: form GET + target="_self"만 사용. 같은 탭 유지, locale 유지.
 * oauth-start는 이제 모든 UA(모바일·데스크톱)에서 200 HTML + location.replace()를 반환.
 */
import { test, expect } from '@playwright/test'

test.describe('Facebook login UI', () => {
  test('버튼 클릭 시 새 창 없이 같은 탭에서만 이동한다', async ({ page, context }) => {
    await page.goto('/en/login')

    const btn = page.getByRole('button', { name: /continue with facebook/i })
    await expect(btn).toBeVisible()

    let popupOpened = false
    context.on('page', () => { popupOpened = true })

    await btn.click()
    await page.waitForTimeout(2500)

    expect(popupOpened, '새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지 1개만 유지').toBe(1)
  })

  test('다른 locale 로그인 페이지에서 form에 locale이 포함된다', async ({ page }) => {
    await page.goto('/ko/login')
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: /continue with facebook/i }) })
    await expect(form.locator('input[name=locale]')).toHaveValue('ko')
    await expect(form).toHaveAttribute('action', /oauth-start/)
    await expect(form).toHaveAttribute('target', '_self')
  })
})

test.describe('OAuth start API', () => {
  test('모바일 User-Agent 시 200 HTML + location.replace + locale 쿠키', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=ko', {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    // location.replace() 방식 확인
    expect(body).toContain('location.replace')
    expect(body).toContain('supabase')
    // form submit 방식 쿼리 손실 없음 확인 (provider= 가 URL에 포함)
    expect(body).toContain('provider=facebook')
    const setCookie = res.headers()['set-cookie']
    expect(setCookie).toBeDefined()
    expect(setCookie).toContain('mytripfy_oauth_locale')
  })

  test('갤럭시 S25 Chrome User-Agent 시 200 HTML + location.replace', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 15; SM-S931B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('location.replace')
    expect(body).toContain('provider=facebook')
    expect(res.headers()['set-cookie']).toContain('mytripfy_oauth_locale')
  })

  test('데스크톱 User-Agent 시도 200 HTML + location.replace (새 창 방지 통일)', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=ja', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('location.replace')
    expect(body).toContain('provider=facebook')
    expect(res.headers()['set-cookie']).toContain('mytripfy_oauth_locale')
  })
})

test.describe('모바일 뷰포트 (갤럭시 등)', () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true })

  test('Facebook 버튼 탭 시 새 창이 열리지 않는다', async ({ page, context }) => {
    await page.goto('/en/login')
    const btn = page.getByRole('button', { name: /continue with facebook/i })
    await expect(btn).toBeVisible()

    const pageCountBefore = context.pages().length
    let newPageOpened = false
    context.on('page', () => { newPageOpened = true })

    await btn.click()
    await page.waitForTimeout(2500)

    expect(newPageOpened, '모바일에서 새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지 수 유지').toBe(pageCountBefore)
  })
})
