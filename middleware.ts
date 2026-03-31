import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './src/i18n/routing'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

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

const isClerkRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/auth(.*)',
])

const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl

  // Android App Links 검증 파일 - 미들웨어에서 직접 반환
  if (pathname === '/.well-known/assetlinks.json') {
    return new NextResponse(
      JSON.stringify([
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'com.mytripfy.app',
            sha256_cert_fingerprints: [
              'A0:5F:3A:B1:52:56:C8:45:80:A0:02:BE:78:30:0B:AC:14:18:84:7C:E6:8E:0A:C7:92:B5:FE:1B:1C:E2:83:81',
            ],
          },
        },
      ]),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (isClerkRoute(req)) return NextResponse.next()
  if (isApiRoute(req)) return NextResponse.next()

  if (
    pathname.startsWith('/_next/') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|map)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)',
    '/(api|trpc)(.*)',
  ],
}
