/**
 * 모바일 뷰포트(Pixel 5)에서 Facebook 로그인 버튼 클릭 시
 * 새 창/팝업이 열리지 않고 같은 탭에서 리다이렉트되는지 검증.
 */
import { test, expect } from '@playwright/test'

test.describe('Facebook login (mobile viewport)', () => {
  test('버튼 클릭 시 새 창이 열리지 않고 같은 탭에서 이동한다', async ({ page, context }) => {
    await page.goto('/en/login')

    // Facebook 버튼이 보이는지 확인
    const btn = page.getByRole('button', { name: /continue with facebook/i })
    await expect(btn).toBeVisible()

    // 새 페이지(팝업/새 탭)가 열리면 실패하도록 감지
    let popupOpened = false
    context.on('page', () => { popupOpened = true })

    // 버튼 클릭 (form submit → Server Action → redirect)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
      btn.click(),
    ])

    // 새 창이 열리지 않아야 함
    expect(popupOpened, 'Facebook 로그인 버튼 클릭 시 새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지가 1개만 있어야 함 (같은 탭 이동)').toBe(1)
  })
})
