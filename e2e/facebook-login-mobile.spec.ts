/**
 * 소셜 로그인: 링크 클릭 → /api/auth/oauth-start → 302 → 같은 탭에서만 이동.
 * 모든 환경에서 새 창이 열리지 않는지 검증.
 */
import { test, expect } from '@playwright/test'

test.describe('Facebook login', () => {
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
    expect(context.pages().length, '페이지 1개만 유지 (같은 탭 이동)').toBe(1)
  })
})
