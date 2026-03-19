/**
 * Auth: 로그인 폼·이메일 로그인·에러 메시지 검증.
 * 소셜 로그인(OAuth) 관련 테스트는 oauth-flow.spec.ts 에 있습니다.
 */
import { test, expect } from '@playwright/test'

const LOCALE = 'en'

test.describe('로그인 페이지 – 기본 요소', () => {
  test('이메일·소셜 버튼이 모두 표시된다', async ({ page }) => {
    await page.goto(`/${LOCALE}/login`)
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with facebook/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with apple/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email|@/i)).toBeVisible()
    await expect(page.getByPlaceholder(/password|•••/i)).toBeVisible()
  })
})

test.describe('로그인 페이지 – 에러 메시지', () => {
  test('?message=Could+not+authenticate+user 이면 에러 문구가 표시된다', async ({ page }) => {
    await page.goto(`/${LOCALE}/login?message=Could+not+authenticate+user`)
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible()
  })
})
