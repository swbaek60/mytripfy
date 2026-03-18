/**
 * Smoke: 주요 페이지가 정상 로드(200)되는지 검증.
 * 인증 필요 페이지는 200 또는 로그인으로 리다이렉트되면 통과.
 */
import { test, expect } from '@playwright/test'

const LOCALE = 'en'

test.describe('Smoke – 페이지 로드', () => {
  test('홈 /en', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('로그인 /en/login', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/login`)
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('button', { name: /continue with facebook/i })).toBeVisible({ timeout: 10000 })
  })

  test('동행 목록 /en/companions', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/companions`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('가이드 목록 /en/guides', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/guides`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('가이드 요청 목록 /en/guides/requests', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/guides/requests`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('트립 목록 /en/trips', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/trips`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('스폰서 목록 /en/sponsors', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/sponsors`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('챌린지 /en/challenges', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/challenges`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('명예의 전당 /en/hall-of-fame', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/hall-of-fame`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('개인정보처리방침 /en/privacy', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/privacy`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('대시보드(비로그인) /en/dashboard', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/dashboard`)
    expect(res?.status()).toBe(200)
    const url = page.url()
    const bodyVisible = await page.locator('body').isVisible()
    expect(bodyVisible).toBe(true)
    if (url.includes('/login')) expect(url).toContain('login')
    else expect(url).toContain('dashboard')
  })

  test('프로필(비로그인) /en/profile', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/profile`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('북마크(비로그인) /en/bookmarks', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/bookmarks`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('알림(비로그인) /en/notifications', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/notifications`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('메시지(비로그인) /en/messages', async ({ page }) => {
    const res = await page.goto(`/${LOCALE}/messages`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })
})
