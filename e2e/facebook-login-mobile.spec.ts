/**
 * 모바일 뷰포트에서 Facebook 로그인 클릭 시 같은 탭으로 이동하는지 검증.
 * (새 창/팝업이 열리면 실패)
 */
import { test, expect } from '@playwright/test'

test.describe('Facebook login (mobile viewport)', () => {
  test('클릭 시 새 창이 열리지 않고 같은 탭에서 리다이렉트된다', async ({ page, context }) => {
    // 로그인 페이지로 이동
    await page.goto('/en/login')
    await expect(page.getByRole('link', { name: /continue with facebook/i })).toBeVisible()

    // 새 페이지(팝업)가 생기면 실패하도록 감지
    let popupOpened = false
    context.on('page', () => {
      popupOpened = true
    })

    // Facebook 로그인 링크 클릭 → 우리 API → 302 → Supabase 등으로 이동
    const link = page.getByRole('link', { name: /continue with facebook/i })
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
      link.click(),
    ])

    // 새 창이 열리지 않았어야 함 (같은 탭에서만 이동)
    expect(popupOpened, 'Facebook 로그인 클릭 시 새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지가 1개만 있어야 함 (같은 탭)').toBe(1)
  })
})
