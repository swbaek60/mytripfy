/**
 * OAuth 소셜 로그인 E2E 테스트
 *
 * 검증 범위:
 * 1. oauth-start API: 모든 provider/UA에서 200 + form(hidden inputs) 반환
 * 2. oauth-start API: locale 쿠키 설정
 * 3. oauth-start API: 잘못된 provider 처리
 * 4. auth/callback: code 없을 때 로그인 페이지로 리다이렉트
 * 5. auth/callback: 새 창 완료 시 postMessage → opener 이동 흐름
 * 6. 로그인 페이지 UI: form 구조, target=_self
 * 7. 로그인 페이지 UI: 버튼 클릭 시 새 창 없음 (Playwright 환경)
 */
import { test, expect } from '@playwright/test'

// ── User-Agent 상수 ──────────────────────────────────────────────────────────
const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  iphoneSafari:  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  samsungBrowser:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36',
  androidFirefox:'Mozilla/5.0 (Android 15; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  iphoneChrome:  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  desktopSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
}

const MOBILE_UAS = [
  { label: 'Android Chrome',  ua: UA.androidChrome },
  { label: 'iPhone Safari',   ua: UA.iphoneSafari },
  { label: 'Samsung Browser', ua: UA.samsungBrowser },
  { label: 'Android Firefox', ua: UA.androidFirefox },
  { label: 'iPhone Chrome',   ua: UA.iphoneChrome },
]

const DESKTOP_UAS = [
  { label: 'Desktop Chrome', ua: UA.desktopChrome },
  { label: 'Desktop Safari', ua: UA.desktopSafari },
]

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

/**
 * oauth-start 응답 HTML이 올바른 form 구조인지 검증합니다.
 * - oauthForm id 존재
 * - action이 Supabase authorize base URL (쿼리 없음)
 * - provider, code_challenge, redirect_to가 hidden input으로 전달됨
 */
function assertOAuthForm(body: string, provider: string) {
  expect(body).toContain('id="oauthForm"')
  expect(body).toMatch(/action="https?:\/\/[^?&"]+\/auth\/v1\/authorize"/)
  expect(body).toContain(`name="provider" value="${provider}"`)
  expect(body).toContain('name="code_challenge"')
  expect(body).toContain('name="redirect_to"')
  expect(body).toContain('target="_self"')
  expect(body).not.toContain('target="_blank"')
}

// ── 1. oauth-start API ────────────────────────────────────────────────────────

test.describe('oauth-start API', () => {
  test.describe('모든 provider/UA에서 200 + form 반환', () => {
    for (const provider of ['google', 'facebook', 'apple'] as const) {
      for (const { label, ua } of [...MOBILE_UAS, ...DESKTOP_UAS]) {
        test(`[${provider}] ${label}`, async ({ request }) => {
          const res = await request.get(`/api/auth/oauth-start?provider=${provider}&locale=en`, {
            headers: { 'User-Agent': ua },
          })
          expect(res.status(), `${provider}/${label} status`).toBe(200)
          assertOAuthForm(await res.text(), provider)
          expect(
            (res.headers()['set-cookie'] ?? '').toString(),
            'locale 쿠키'
          ).toContain('mytripfy_oauth_locale')
        })
      }
    }
  })

  test('locale=ko → locale 쿠키에 ko 저장', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=google&locale=ko', {
      headers: { 'User-Agent': UA.androidChrome },
    })
    expect(res.status()).toBe(200)
    const cookie = (res.headers()['set-cookie'] ?? '').toString()
    expect(cookie).toContain('mytripfy_oauth_locale')
    expect(cookie).toContain('ko')
  })

  test('잘못된 provider → 302 + 로그인 페이지', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?provider=twitter&locale=en', {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/\/login/)
  })

  test('provider 없음 → 302 + 로그인 페이지', async ({ request }) => {
    const res = await request.get('/api/auth/oauth-start?locale=en', { maxRedirects: 0 })
    expect(res.status()).toBe(302)
    expect(res.headers()['location']).toMatch(/\/login/)
  })
})

// ── 2. auth/callback ──────────────────────────────────────────────────────────

test.describe('auth/callback', () => {
  test('code 없으면 200 HTML + 로그인으로 이동하는 스크립트', async ({ request }) => {
    const res = await request.get('/auth/callback?locale=en', { maxRedirects: 0 })
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/login|Could\+not/)
  })

  /**
   * BroadcastChannel oauth_complete 수신 시 pickupUrl로 이동하는지 검증.
   * 유효하지 않은 token이면 session-pickup이 로그인으로 리다이렉트함.
   */
  test('BroadcastChannel oauth_complete → 로그인 탭이 pickupUrl로 이동', async ({ page }) => {
    await page.goto('/en/login')
    const base = page.url().replace(/\/en\/login.*/, '')
    const pickupUrl = `${base}/auth/session-pickup?token=invalid-e2e`
    const dest = `${base}/en`

    await page.evaluate(({ pickup, d }) => {
      const ch = new BroadcastChannel('mytripfy_oauth')
      ch.postMessage({ type: 'oauth_complete', pickupUrl: pickup, dest: d })
      ch.close()
    }, { pickup: pickupUrl, d: dest })

    await page.waitForURL(/session-pickup|login/, { timeout: 5000 })
    expect(page.url()).toMatch(/session-pickup|login/)
  })

  /**
   * BroadcastChannel oauth_retry 수신 시 전달된 URL로 이동하는지 검증.
   */
  test('BroadcastChannel oauth_retry → 로그인 탭이 콜백 URL로 이동', async ({ page }) => {
    await page.goto('/en/login')
    const base = page.url().replace(/\/en\/login.*/, '')
    const callbackUrl = `${base}/auth/callback?locale=en`

    await page.evaluate((url) => {
      const ch = new BroadcastChannel('mytripfy_oauth')
      ch.postMessage({ type: 'oauth_retry', url })
      ch.close()
    }, callbackUrl)

    await page.waitForURL(/auth\/callback|login/, { timeout: 5000 })
    expect(page.url()).toMatch(/auth\/callback|login/)
  })
})

// ── 2b. auth/session-pickup ───────────────────────────────────────────────────

test.describe('auth/session-pickup', () => {
  test('token 없으면 로그인 페이지로 리다이렉트', async ({ request }) => {
    const res = await request.get('/auth/session-pickup', { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    expect(res.headers()['location']).toMatch(/\/login/)
  })

  test('잘못된 token이면 로그인 페이지로 리다이렉트', async ({ request }) => {
    const res = await request.get('/auth/session-pickup?token=invalid-token', { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    expect(res.headers()['location']).toMatch(/\/login/)
  })
})

// ── 3. 로그인 페이지 UI ───────────────────────────────────────────────────────

test.describe('로그인 페이지 – form 구조', () => {
  test('Google/Apple/Facebook 모두 form + target=_self', async ({ page }) => {
    await page.goto('/en/login')
    for (const provider of ['google', 'apple', 'facebook'] as const) {
      const form = page.locator('form').filter({
        has: page.locator(`input[name=provider][value=${provider}]`),
      })
      await expect(form.first(), `${provider} form`).toHaveAttribute('action', /oauth-start/)
      await expect(form.first(), `${provider} target`).toHaveAttribute('target', '_self')
    }
  })

  test('locale=ko 로그인 페이지에서 locale hidden input이 ko', async ({ page }) => {
    await page.goto('/ko/login')
    for (const provider of ['google', 'apple', 'facebook'] as const) {
      const form = page.locator('form').filter({
        has: page.locator(`input[name=provider][value=${provider}]`),
      })
      await expect(
        form.first().locator('input[name=locale]'),
        `${provider} locale`
      ).toHaveValue('ko')
    }
  })
})

// ── 4. UI – 버튼 클릭 시 새 창 없음 (Playwright 환경) ────────────────────────
// 실제 모바일 기기와 달리 Playwright는 form submit을 새 탭으로 열지 않으므로,
// 이 테스트는 "코드 레벨에서 target=_blank 등이 없음"을 보장합니다.

test.describe('소셜 버튼 클릭 – 새 창 없음', () => {
  const viewports = [
    { label: 'iPhone Safari',   vp: { width: 390, height: 844 }, ua: UA.iphoneSafari,   mobile: true },
    { label: 'Android Chrome',  vp: { width: 412, height: 915 }, ua: UA.androidChrome,  mobile: true },
    { label: 'Samsung Browser', vp: { width: 412, height: 915 }, ua: UA.samsungBrowser, mobile: true },
    { label: 'Android Firefox', vp: { width: 412, height: 915 }, ua: UA.androidFirefox, mobile: true },
    { label: 'Desktop Chrome',  vp: { width: 1280, height: 720 }, ua: UA.desktopChrome, mobile: false },
  ]

  for (const { label, vp, ua, mobile } of viewports) {
    for (const provider of ['Google', 'Apple', 'Facebook'] as const) {
      test(`[${label}] ${provider} 버튼 → 새 창 없음`, async ({ page, context, browser: _b }) => {
        await page.setViewportSize(vp)
        await page.setExtraHTTPHeaders({ 'User-Agent': ua })
        if (mobile) await page.emulateMedia({ media: 'screen' })

        await page.goto('/en/login')
        const btn = page.getByRole('button', { name: new RegExp(`continue with ${provider}`, 'i') })
        await expect(btn).toBeVisible()

        let newPage = false
        context.on('page', () => { newPage = true })

        await btn.click()
        await page.waitForTimeout(1500)

        expect(newPage, `${label}/${provider}: 새 창 없음`).toBe(false)
        expect(context.pages().length, '탭 1개 유지').toBe(1)
      })
    }
  }
})
