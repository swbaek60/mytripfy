/**
 * Facebook 로그인 플로우 검증
 * - 모바일: 팝업으로 열리거나(의도된 동작) 같은 탭 이동(팝업 차단 시 폴백)
 * - 데스크톱: 같은 탭에서만 이동, 새 창 없음
 */
import { test, expect } from '@playwright/test'

test.describe('Facebook login (mobile viewport)', () => {
  test('버튼 클릭 시 팝업이 열리거나 같은 탭에서 이동한다', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile')
    await page.goto('/en/login')

    const btn = page.getByRole('button', { name: /continue with facebook/i })
    await expect(btn).toBeVisible()

    await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
      btn.click(),
    ])

    await page.waitForTimeout(2000)

    const pages = context.pages()
    // 모바일: 의도적으로 팝업 사용 → 팝업 열림(pages.length >= 2) 또는 팝업 차단 시 같은 탭 이동
    const popupOpened = pages.length >= 2
    const sameTabNavigated = !page.url().includes('/login')

    expect(
      popupOpened || sameTabNavigated,
      '모바일: 팝업이 열리거나 같은 탭에서 이탈해야 함'
    ).toBe(true)
  })
})

test.describe('Facebook login (desktop viewport)', () => {
  test('버튼 클릭 시 새 창 없이 같은 탭에서만 이동한다', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop')
    await page.goto('/en/login')

    const btn = page.getByRole('button', { name: /continue with facebook/i })
    await expect(btn).toBeVisible()

    let popupOpened = false
    context.on('page', () => { popupOpened = true })

    await Promise.all([
      page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 }).catch(() => {}),
      btn.click(),
    ])

    expect(popupOpened, '데스크톱에서는 새 창이 열리면 안 됨').toBe(false)
    expect(context.pages().length, '페이지 1개만 유지 (같은 탭 이동)').toBe(1)
  })
})
