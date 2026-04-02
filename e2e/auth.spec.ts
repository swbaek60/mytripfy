/**
 * Auth: Clerk /sign-in 노출 및 비로그인 리다이렉트 검증.
 */
import { test, expect } from '@playwright/test'

const LOCALE = 'en'

test.describe('Clerk 로그인(/sign-in)', () => {
  test('/en/login 리다이렉트 후 이메일 입력·로그인 UI가 있다', async ({ page }) => {
    await page.goto(`/${LOCALE}/login`, { waitUntil: 'commit' })
    await page.waitForURL(/\/sign-in/, { timeout: 20000 })
    await expect(page.locator('.cl-rootBox').first()).toBeVisible({ timeout: 20000 })
    const email = page.locator('input[type="email"], input[name="identifier"], input#identifier-field')
    await expect(email.first()).toBeVisible({ timeout: 15000 })
  })
})

test.describe('레거시 세션 픽업 메시지', () => {
  test('session-pickup 실패 시 /en/login 으로 보내짐(메시지 쿼리)', async ({ request }) => {
    const res = await request.get('/auth/session-pickup', { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    const loc = res.headers().location ?? ''
    expect(loc).toMatch(/login/)
    expect(loc).toMatch(/message=/)
  })
})
