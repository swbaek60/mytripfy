/**
 * Navigation: 홈·로그인·공개 페이지의 링크/버튼이 올바른 경로로 연결되는지 검증.
 */
import { test, expect } from '@playwright/test'

const LOCALE = 'en'

test.describe('Navigation – 홈', () => {
  test('홈에서 Companions 링크 클릭 시 /en/companions 로 이동', async ({ page }) => {
    await page.goto(`/${LOCALE}`)
    await page.getByRole('link', { name: /find companions/i }).first().click()
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/companions`))
  })

  test('홈에서 Login 링크 클릭 시 /en/login 로 이동', async ({ page }) => {
    await page.goto(`/${LOCALE}`)
    await page.getByRole('link', { name: /login|sign up|signup/i }).first().click()
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/login`))
  })

  test('홈에서 Hall of Fame 링크 클릭 시 /en/hall-of-fame 로 이동', async ({ page }) => {
    await page.goto(`/${LOCALE}`)
    await page.getByRole('link', { name: /hall of fame/i }).first().click()
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/hall-of-fame`))
  })

  test('홈에서 Privacy 링크 클릭 시 /en/privacy 로 이동', async ({ page }) => {
    await page.goto(`/${LOCALE}`)
    await page.getByRole('link', { name: /privacy/i }).first().click()
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/privacy`))
  })

  test('홈에서 Guides 링크 클릭 시 /en/guides 로 이동', async ({ page }) => {
    await page.goto(`/${LOCALE}`)
    await page.getByRole('link', { name: /find guides|guides/i }).first().click()
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/guides`))
  })
})

test.describe('Navigation – 로그인(Clerk /sign-in)', () => {
  test('/en/login 리다이렉트 후 Clerk SignIn 루트가 보인다', async ({ page }) => {
    await page.goto(`/${LOCALE}/login`, { waitUntil: 'commit' })
    await page.waitForURL(/\/sign-in/, { timeout: 20000 })
    await expect(page.locator('.cl-rootBox').first()).toBeVisible({ timeout: 20000 })
    const email = page.locator('input[type="email"], input[name="identifier"], input#identifier-field')
    await expect(email.first()).toBeVisible({ timeout: 15000 })
  })

  test('/sign-in 에서 소셜·이메일 로그인 UI가 있다', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.locator('.cl-rootBox').first()).toBeVisible({ timeout: 20000 })
    const hasSocial =
      (await page.getByRole('button', { name: /google|facebook|apple|continue/i }).count()) > 0
    const hasEmail = (await page.locator('input[type="email"], input[name="identifier"]').count()) > 0
    expect(hasSocial || hasEmail).toBe(true)
  })
})

test.describe('Navigation – 동행 목록', () => {
  test('동행 목록 페이지에 New post 또는 Login 링크가 있다', async ({ page }) => {
    await page.goto(`/${LOCALE}/companions`)
    const newOrLogin = page.getByRole('link', { name: /new|post|login/i })
    await expect(newOrLogin.first()).toBeVisible({ timeout: 8000 })
  })
})

test.describe('Navigation – 개인정보처리방침', () => {
  test('Privacy 페이지에서 헤더 로고(홈) 링크 클릭 시 /en 으로 이동', async ({ page }) => {
    await page.goto(`/${LOCALE}/privacy`)
    const homeLink = page.locator('header a[href*="/en"]').first()
    await homeLink.click()
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/?$`))
  })
})

test.describe('Navigation – 가이드', () => {
  test('가이드 목록에 Request guide 또는 유사 CTA가 있다', async ({ page }) => {
    await page.goto(`/${LOCALE}/guides`)
    await expect(page.locator('body')).toBeVisible()
    const link = page.getByRole('link', { name: /request|guide|find/i }).first()
    await expect(link).toBeVisible({ timeout: 8000 })
  })
})
