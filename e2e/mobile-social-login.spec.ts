/**
 * 모바일 소셜 로그인 E2E 테스트
 * - 모바일에서 google/apple은 200 HTML + form submit
 * - 모바일에서 facebook은 307 redirect (모바일 새 탭 이슈 대응)
 * - 각종 모바일 브라우저(Chrome/Firefox/Safari/Samsung) 뷰포트에서 버튼 클릭 시 새 창 없음 검증
 */
import { test, expect } from '@playwright/test'

const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  samsungBrowser: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 15; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  desktopSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1',
}

const MOBILE_UAS = [
  { label: 'Android Chrome', ua: UA.androidChrome },
  { label: 'iPhone Safari', ua: UA.iphoneSafari },
  { label: 'Samsung Browser', ua: UA.samsungBrowser },
  { label: 'Android Firefox', ua: UA.androidFirefox },
  { label: 'iPhone Chrome', ua: UA.iphoneChrome },
]
const DESKTOP_UAS = [
  { label: 'Desktop Chrome', ua: UA.desktopChrome },
  { label: 'Desktop Safari', ua: UA.desktopSafari },
]

// ──────────────────────────────────────────────
// API: 모바일 UA
// - google/apple: 200 HTML + provider hidden input
// - facebook: 307 redirect(새 탭/팝업 이슈 대응)
// ──────────────────────────────────────────────
test.describe('API – oauth-start: 모바일 UA', () => {
  for (const provider of ['google', 'facebook', 'apple'] as const) {
    for (const { label, ua } of MOBILE_UAS) {
      test(`[${provider}] ${label} → 네비게이션 방식 검증`, async ({ request }) => {
        const res = await request.get(`/api/auth/oauth-start?provider=${provider}&locale=en`, {
          headers: { 'User-Agent': ua },
          maxRedirects: 0,
        })

        // locale 쿠키는 공통으로 설정돼야 함
        expect((res.headers()['set-cookie'] ?? '').toString()).toContain('mytripfy_oauth_locale')

        if (provider === 'facebook') {
          expect(res.status(), `${provider} / ${label}`).toBe(307)
          expect(res.headers()['location']).toMatch(/\/auth\/v1\/authorize/i)
          return
        }

        expect(res.status(), `${provider} / ${label}`).toBe(200)
        const body = await res.text()
        // form 존재 확인
        expect(body).toContain('id="oauthForm"')
        // action에 쿼리 없는 base URL (핵심: provider가 hidden input으로 들어가야 함)
        expect(body).toMatch(/action="https?:\/\/[^"]+\/auth\/v1\/authorize"/)
        // provider가 hidden input으로 분해됐는지 확인 (form GET 쿼리 누락 방지)
        expect(body).toContain(`name="provider" value="${provider}"`)
        expect(body).toContain('name="code_challenge"')
      })
    }
  }
})

test.describe('API – oauth-start: 데스크톱 UA는 200 HTML + form', () => {
  for (const provider of ['google', 'facebook', 'apple'] as const) {
    for (const { label, ua } of DESKTOP_UAS) {
      test(`[${provider}] ${label} → 200 + oauthForm`, async ({ request }) => {
        const res = await request.get(`/api/auth/oauth-start?provider=${provider}&locale=en`, {
          headers: { 'User-Agent': ua },
        })
        expect(res.status()).toBe(200)
        const body = await res.text()
        expect(body).toContain('oauthForm')
        expect(body).toContain('target="_self"')
        expect(body).not.toContain('target="_blank"')
      })
    }
  }
})

test.describe('API – locale 쿠키', () => {
  test('모바일 (ko) → 200 + Supabase authorize form + locale 쿠키', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=ko', {
      headers: { 'User-Agent': UA.androidChrome },
    })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/auth\/v1\/authorize/i)
    expect((res.headers()['set-cookie'] ?? '').toString()).toContain('mytripfy_oauth_locale')
  })
  test('데스크톱 (en) → 200 + locale 쿠키', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=facebook&locale=en', {
      headers: { 'User-Agent': UA.desktopChrome },
    })
    expect(res.status()).toBe(200)
    expect((res.headers()['set-cookie'] ?? '').toString()).toContain('mytripfy_oauth_locale')
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

test.describe('Android Firefox UI – 소셜 버튼 클릭 시 새 창 없음', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    userAgent: UA.androidFirefox,
  })

  for (const provider of ['Google', 'Apple', 'Facebook'] as const) {
    test(`[Android Firefox] ${provider} 버튼 탭 → 새 창 없음`, async ({ page, context }) => {
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
// 로그인 페이지 – 소셜 form (target=_self, 같은 창)
// ──────────────────────────────────────────────
test.describe('로그인 페이지 – 소셜 form', () => {
  test('Google/Apple/Facebook form: action=oauth-start, target=_self', async ({ page }) => {
    await page.goto('/en/login')
    for (const name of [/continue with google/i, /continue with apple/i, /continue with facebook/i]) {
      const form = page.locator('form').filter({ has: page.getByRole('button', { name }) })
      await expect(form).toHaveAttribute('action', /oauth-start/)
      await expect(form).toHaveAttribute('target', '_self')
    }
  })

  test('Facebook 버튼 클릭 시 새 창 없이 같은 창에서만 이동', async ({ page, context }) => {
    await page.goto('/en/login')
    const btn = page.getByRole('button', { name: /continue with facebook/i })
    await expect(btn).toBeVisible()
    let popup = false
    context.on('page', () => { popup = true })
    await btn.click()
    await page.waitForURL(/oauth-start|supabase|facebook/, { timeout: 10000 }).catch(() => {})
    expect(popup, '새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length).toBe(1)
  })
})
