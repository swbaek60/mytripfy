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
  '/:locale/sponsors/:id/edit(.*)',
  '/:locale/sponsors/mine(.*)',
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

  // /en/invite/abc123 → cookie + sign-up (Server Component cookie set 회피)
  const inviteMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\/invite\/([a-zA-Z0-9]{4,16})\/?$/)
  if (inviteMatch) {
    const locale = inviteMatch[1]
    const code = inviteMatch[2].toLowerCase()
    const url = req.nextUrl.clone()
    url.pathname = '/sign-up'
    url.search = `?redirect_url=${encodeURIComponent(`/${locale}`)}`
    const res = NextResponse.redirect(url)
    res.cookies.set('mt_ref', code, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  }

  // Capture ?ref= for referral attribution
  const refParam = req.nextUrl.searchParams.get('ref')
  const setRefCookie = (res: NextResponse) => {
    if (refParam && /^[a-zA-Z0-9]{4,16}$/.test(refParam)) {
      res.cookies.set('mt_ref', refParam.toLowerCase(), {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
    }
    return res
  }

  // Clerk 전용 경로: i18n 우회, Clerk 처리만
  if (isClerkRoute(req)) {
    return setRefCookie(NextResponse.next())
  }

  // API 경로: i18n 우회, Clerk 인증 컨텍스트는 유지됨
  if (isApiRoute(req)) {
    return setRefCookie(NextResponse.next())
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
  return setRefCookie(intlMiddleware(req) as NextResponse)
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
