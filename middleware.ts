import { clerkMiddleware } from '@clerk/nextjs/server'

/**
 * Clerk 인증 미들웨어.
 * - 모든 요청에 Clerk 세션 컨텍스트를 주입하여 서버 컴포넌트에서 auth()가 정상 동작하도록 함
 * - next-intl 라우팅은 createNextIntlPlugin(next.config.ts)과 [locale] URL 세그먼트로 처리되므로
 *   별도의 intlMiddleware 불필요
 */
export default clerkMiddleware()

export const config = {
  matcher: [
    // Next.js 내부 파일, 정적 파일, .well-known 경로 제외
    '/((?!_next|\.well-known|well-known|[^?]*\\.(?:html?|css|js(?!on)|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API 라우트는 항상 실행
    '/(api|trpc)(.*)',
  ],
}
