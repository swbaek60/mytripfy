/**
 * 모바일 소셜 로그인 E2E 테스트
 * - 모든 소셜 버튼(Google/Apple/Facebook)이 새 창/탭을 열지 않고 같은 탭에서 이동하는지 검증
 * - 다양한 모바일 브라우저 UA 및 뷰포트 커버
 * - API 레벨에서 200 HTML + form submit 방식 검증
 */
import { test, expect, devices } from '@playwright/test'

// ──────────────────────────────────────────────
// 공통 UA 상수
// ──────────────────────────────────────────────
const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 15; SM-S931B Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  samsungBrowser: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  desktopSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1',
}

// ──────────────────────────────────────────────
// API 레벨: 모든 provider × UA 조합 검증
// ──────────────────────────────────────────────
test.describe('API – oauth-start: 모든 provider × UA 조합', () => {
  const providers = ['google', 'facebook', 'apple'] as const
  const uaEntries = [
    { label: 'Android Chrome', ua: UA.androidChrome },
    { label: 'iPhone Safari', ua: UA.iphoneSafari },
    { label: 'Samsung Browser', ua: UA.samsungBrowser },
    { label: 'Desktop Chrome', ua: UA.desktopChrome },
    { label: 'Desktop Safari', ua: UA.desktopSafari },
    { label: 'iPhone Chrome', ua: UA.iphoneChrome },
  ]

  for (const provider of providers) {
    for (const { label, ua } of uaEntries) {
      test(`[${provider}] ${label} → 200 HTML + form target="_self"`, async ({ request }) => {
        const res = await request.get(`/api/auth/oauth-start?provider=${provider}&locale=en`, {
          headers: { 'User-Agent': ua },
        })
        expect(res.status(), `${provider} / ${label} 상태 코드`).toBe(200)
        const body = await res.text()
        expect(body, 'form 태그 포함').toContain('<form')
        expect(body, 'target="_self" 포함').toContain('target="_self"')
        expect(body, 'supabase URL 포함').toContain('supabase')
        // 새 창을 여는 target="_blank" 가 없어야 함
        expect(body, 'target="_blank" 없음').not.toContain('target="_blank"')
      })
    }
  }

  test('locale 쿠키가 응답에 포함된다 (ko)', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=ko', {
      headers: { 'User-Agent': UA.androidChrome },
    })
    expect(res.status()).toBe(200)
    const setCookie = res.headers()['set-cookie'] ?? ''
    expect(setCookie).toContain('mytripfy_oauth_locale')
    expect(setCookie).toContain('ko')
  })

  test('locale 쿠키가 응답에 포함된다 (en, 데스크톱)', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': UA.desktopChrome },
    })
    expect(res.status()).toBe(200)
    const setCookie = res.headers()['set-cookie'] ?? ''
    expect(setCookie).toContain('mytripfy_oauth_locale')
  })
})

// ──────────────────────────────────────────────
// UI 레벨: 모바일 뷰포트에서 버튼 클릭 시 새 창 없음
// ──────────────────────────────────────────────
test.describe('모바일 UI – 소셜 버튼 클릭 시 새 창 없음', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent: UA.iphoneSafari,
  })

  for (const provider of ['Google', 'Apple', 'Facebook'] as const) {
    test(`[iPhone Safari] ${provider} 버튼 탭 → 새 창 없음`, async ({ page, context }) => {
      await page.goto('/en/login')
      const btn = page.getByRole('button', { name: new RegExp(`continue with ${provider}`, 'i') })
      await expect(btn).toBeVisible()

      let popupOpened = false
      context.on('page', () => { popupOpened = true })

      await btn.click()
      await page.waitForTimeout(2500)

      expect(popupOpened, `${provider}: 새 창이 열리면 안 됨`).toBe(false)
      expect(context.pages().length, '페이지 1개만 유지').toBe(1)
    })
  }
})

test.describe('Android Chrome UI – 소셜 버튼 클릭 시 새 창 없음', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    userAgent: UA.androidChrome,
  })

  for (const provider of ['Google', 'Apple', 'Facebook'] as const) {
    test(`[Android Chrome] ${provider} 버튼 탭 → 새 창 없음`, async ({ page, context }) => {
      await page.goto('/en/login')
      const btn = page.getByRole('button', { name: new RegExp(`continue with ${provider}`, 'i') })
      await expect(btn).toBeVisible()

      let popupOpened = false
      context.on('page', () => { popupOpened = true })

      await btn.click()
      await page.waitForTimeout(2500)

      expect(popupOpened, `${provider}: 새 창이 열리면 안 됨`).toBe(false)
      expect(context.pages().length, '페이지 1개만 유지').toBe(1)
    })
  }
})

test.describe('Samsung Browser UI – 소셜 버튼 클릭 시 새 창 없음', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    userAgent: UA.samsungBrowser,
  })

  for (const provider of ['Google', 'Apple', 'Facebook'] as const) {
    test(`[Samsung Browser] ${provider} 버튼 탭 → 새 창 없음`, async ({ page, context }) => {
      await page.goto('/en/login')
      const btn = page.getByRole('button', { name: new RegExp(`continue with ${provider}`, 'i') })
      await expect(btn).toBeVisible()

      let popupOpened = false
      context.on('page', () => { popupOpened = true })

      await btn.click()
      await page.waitForTimeout(2500)

      expect(popupOpened, `${provider}: 새 창이 열리면 안 됨`).toBe(false)
      expect(context.pages().length, '페이지 1개만 유지').toBe(1)
    })
  }
})

// ──────────────────────────────────────────────
// 데스크톱에서도 새 창 없음 확인
// ──────────────────────────────────────────────
test.describe('데스크톱 UI – 소셜 버튼 클릭 시 새 창 없음', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  for (const provider of ['Google', 'Apple', 'Facebook'] as const) {
    test(`[Desktop] ${provider} 버튼 클릭 → 새 창 없음`, async ({ page, context }) => {
      await page.goto('/en/login')
      const btn = page.getByRole('button', { name: new RegExp(`continue with ${provider}`, 'i') })
      await expect(btn).toBeVisible()

      let popupOpened = false
      context.on('page', () => { popupOpened = true })

      await btn.click()
      await page.waitForTimeout(2500)

      expect(popupOpened, `${provider}: 새 창이 열리면 안 됨`).toBe(false)
      expect(context.pages().length, '페이지 1개만 유지').toBe(1)
    })
  }
})

// ──────────────────────────────────────────────
// form 속성 검증 (로그인 페이지 구조)
// ──────────────────────────────────────────────
test.describe('로그인 페이지 – form 속성 검증', () => {
  test('Google form: action=oauth-start, method=GET, target=_self', async ({ page }) => {
    await page.goto('/en/login')
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: /continue with google/i }) })
    await expect(form).toHaveAttribute('action', /oauth-start/)
    await expect(form).toHaveAttribute('method', 'GET')
    await expect(form).toHaveAttribute('target', '_self')
    await expect(form.locator('input[name=provider]')).toHaveValue('google')
    await expect(form.locator('input[name=locale]')).toHaveValue('en')
  })

  test('Apple form: action=oauth-start, method=GET, target=_self', async ({ page }) => {
    await page.goto('/en/login')
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: /continue with apple/i }) })
    await expect(form).toHaveAttribute('action', /oauth-start/)
    await expect(form).toHaveAttribute('method', 'GET')
    await expect(form).toHaveAttribute('target', '_self')
    await expect(form.locator('input[name=provider]')).toHaveValue('apple')
  })

  test('Facebook form: action=oauth-start, method=GET, target=_self', async ({ page }) => {
    await page.goto('/en/login')
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: /continue with facebook/i }) })
    await expect(form).toHaveAttribute('action', /oauth-start/)
    await expect(form).toHaveAttribute('method', 'GET')
    await expect(form).toHaveAttribute('target', '_self')
    await expect(form.locator('input[name=provider]')).toHaveValue('facebook')
  })

  test('ko locale 페이지에서 form locale 값이 ko', async ({ page }) => {
    await page.goto('/ko/login')
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: /continue with google/i }) })
    await expect(form.locator('input[name=locale]')).toHaveValue('ko')
  })
})
