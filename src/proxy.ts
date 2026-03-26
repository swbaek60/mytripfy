import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

// 로그인이 필요한 보호 경로
const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
  '/:locale/profile(.*)',
  '/:locale/bookmarks(.*)',
  '/:locale/messages(.*)',
  '/:locale/notifications(.*)',
  '/:locale/companions/new(.*)',
  '/:locale/companions/:id/edit(.*)',
  '/:locale/trips/new(.*)',
  '/:locale/trips/:id/edit(.*)',
  '/:locale/guides/requests/new(.*)',
  '/:locale/guides/requests/:id/edit(.*)',
  '/:locale/reviews/mine(.*)',
  '/:locale/reviews/write(.*)',
  '/:locale/sponsors/new(.*)',
  '/:locale/sponsors/:id/edit(.*)',
  '/:locale/sponsors/mine(.*)',
  '/:locale/personality(.*)',
])

// Clerk 전용 경로 (i18n 처리 불필요)
const isClerkRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/auth(.*)',
])

// API 경로 (i18n 처리 불필요, Clerk 인증만 처리)
const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl

  // Clerk 전용 경로: i18n 우회, Clerk 처리만
  if (isClerkRoute(req)) {
    return NextResponse.next()
  }

  // API 경로: i18n 우회, Clerk 인증 컨텍스트는 유지됨
  if (isApiRoute(req)) {
    return NextResponse.next()
  }

  // 정적 파일 및 Next.js 내부 경로 우회
  if (
    pathname.startsWith('/_next/') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|map)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // 보호된 경로: 로그인 필요
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // next-intl 로케일 라우팅 처리
  // clerkMiddleware가 이 응답에 Clerk 인증 헤더를 자동으로 추가함
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    /*
     * 아래를 제외한 모든 요청에 미들웨어 실행:
     * - _next/static (정적 번들 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - 정적 파일 확장자 (svg, png, jpg 등)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)',
    '/(api|trpc)(.*)',
  ],
}
