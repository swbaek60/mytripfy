import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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

export default clerkMiddleware(async (auth, request) => {
  // Android App Links 검증 파일
  if (request.nextUrl.pathname === '/.well-known/assetlinks.json') {
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

  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
