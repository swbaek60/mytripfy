import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
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

// next-intl를 거치지 않을 경로들
const isClerkRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Clerk 전용 경로 (sign-in, sign-up)는 next-intl 우회
  if (isClerkRoute(req)) {
    return NextResponse.next()
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
