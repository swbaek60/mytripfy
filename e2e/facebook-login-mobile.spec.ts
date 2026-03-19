/**
 * Facebook / Google 소셜 로그인: form GET + target="_self".
 * 핵심 검증: form method="GET"은 action URL 쿼리를 무시하므로
 *            provider 등 모든 파라미터를 hidden input으로 분해해 전달해야 함.
 */
import { test, expect } from '@playwright/test'

const MOBILE_UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const MOBILE_UA_GALAXY = 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'

/** oauth-start 응답이 hidden input 방식인지 검증 */
async function assertProviderHiddenInput(body: string, provider: string) {
  expect(body).toContain('id="oauthForm"')
  // action에 쿼리 없는 base URL (쿼리가 action에 있으면 form GET이 날려버림)
  expect(body).toMatch(/action="https?:\/\/[^?&"]+\/auth\/v1\/authorize"/)
  // provider가 hidden input으로 전달됨 (핵심)
  expect(body).toContain(`name="provider" value="${provider}"`)
  // PKCE 파라미터도 hidden input으로
  expect(body).toContain('name="code_challenge"')
  expect(body).toContain('name="redirect_to"')
}

/** 모바일 Facebook: 302 redirect (같은 탭 이동 유도) */
function assertRedirectToSupabase(res: { status: () => number; headers: () => Record<string, string> }) {
  expect(res.status()).toBe(302)
  expect((res.headers()['location'] ?? '').toString()).toMatch(/\/auth\/v1\/authorize/i)
  expect((res.headers()['set-cookie'] ?? '').toString()).toContain('mytripfy_oauth_locale')
}

test.describe('Facebook login UI', () => {
  test('Facebook 클릭 시 새 창 없이 같은 탭에서만 이동한다', async ({ page, context }) => {
    await page.goto('/en/login')
    // 데스크톱: button, 모바일: link
    const btn = page.getByRole('button', { name: /continue with facebook/i }).or(
      page.getByRole('link', { name: /continue with facebook/i })
    )
    await expect(btn).toBeVisible()

    let popupOpened = false
    context.on('page', () => { popupOpened = true })

    await btn.click()
    await page.waitForTimeout(2500)

    expect(popupOpened, '새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지 1개만 유지').toBe(1)
  })

  test('다른 locale 로그인 페이지에서 Facebook에 locale이 포함된다', async ({ page }) => {
    await page.goto('/ko/login')
    await expect(page.getByText(/continue with facebook/i).first()).toBeVisible()
    const form = page.locator('form').filter({ has: page.locator('input[name=provider][value=facebook]') })
    const link = page.locator('a[href*="provider=facebook"]')
    const hasForm = (await form.count()) > 0
    const hasLink = (await link.count()) > 0
    expect(hasForm || hasLink).toBe(true)
    if (hasForm) {
      await expect(form.first().locator('input[name=locale]')).toHaveValue('ko')
      await expect(form.first()).toHaveAttribute('action', /oauth-start/)
    }
    if (hasLink) {
      await expect(link.first()).toHaveAttribute('href', /locale=ko/)
    }
  })
})

test.describe('OAuth start API – provider hidden input 검증', () => {
  test('iPhone Safari (모바일) facebook → 302 redirect + locale 쿠키', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=ko', {
      headers: { 'User-Agent': MOBILE_UA_IPHONE },
      maxRedirects: 0,
    })
    assertRedirectToSupabase(res)
  })

  test('갤럭시 S25 Chrome (모바일) facebook → 302 redirect', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': MOBILE_UA_GALAXY },
      maxRedirects: 0,
    })
    assertRedirectToSupabase(res)
  })

  test('갤럭시 S25 Chrome (모바일) google → 200 + provider hidden input', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=en', {
      headers: { 'User-Agent': MOBILE_UA_GALAXY },
    })
    expect(res.status()).toBe(200)
    await assertProviderHiddenInput(await res.text(), 'google')
  })

  test('데스크톱 facebook → 200 + provider hidden input', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=ja', {
      headers: { 'User-Agent': DESKTOP_UA },
    })
    expect(res.status()).toBe(200)
    await assertProviderHiddenInput(await res.text(), 'facebook')
    expect(res.headers()['set-cookie']).toContain('mytripfy_oauth_locale')
  })
})

test.describe('모바일 뷰포트 (갤럭시 등)', () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true })

  test('Facebook 버튼 탭 시 새 창이 열리지 않는다', async ({ page, context }) => {
    await page.goto('/en/login')
    const btn = page.getByRole('button', { name: /continue with facebook/i }).or(
      page.getByRole('link', { name: /continue with facebook/i })
    )
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
