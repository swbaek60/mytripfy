import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const PROVIDERS = ['google', 'apple', 'facebook'] as const
type Provider = (typeof PROVIDERS)[number]
const LOCALE_COOKIE = 'mytripfy_oauth_locale'

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
}

function isMobileUserAgent(request: Request): boolean {
  const ua = request.headers.get('user-agent') || ''
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
}

function setLocaleCookie(res: NextResponse, locale: string, origin: string) {
  const isSecure = origin.startsWith('https://')
  const hostname = new URL(origin).hostname
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`
  res.cookies.set(LOCALE_COOKIE, encodeURIComponent(locale), {
    path: '/',
    maxAge: 300,
    sameSite: 'lax',
    secure: isSecure,
    ...(domain && { domain }),
  })
}

/**
 * GET /api/auth/oauth-start?provider=...&locale=...
 * - locale을 쿠키에 저장 (Supabase가 redirect_uri 쿼리를 유지하지 않으므로 콜백에서 사용).
 * - 데스크톱: 302로 OAuth URL 이동.
 * - 모바일: 200 HTML + 같은 탭에서 이동 (location.replace, 필요 시 top으로 iframe 탈출).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider') as Provider | null
  const locale = searchParams.get('locale') || 'en'
  const origin = getOrigin()

  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.redirect(`${origin}/${locale}/login?message=Invalid+provider`, 302)
  }

  const supabase = await createClient()
  const options: Parameters<typeof supabase.auth.signInWithOAuth>[0]['options'] = {
    redirectTo: `${origin}/auth/callback?locale=${locale}`,
  }
  if (provider === 'google') {
    options.queryParams = { access_type: 'offline', prompt: 'consent' }
  }
  if (provider === 'facebook') {
    options.queryParams = { display: 'page' }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/${locale}/login?message=Could+not+authenticate+user`, 302)
  }

  const url = data.url

  if (isMobileUserAgent(request)) {
    const safeUrl = JSON.stringify(url)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>(function(){var u=${safeUrl};if(window.top!==window.self){window.top.location.replace(u);}else{window.location.replace(u);}})();</script></body></html>`
    const res = new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
    setLocaleCookie(res, locale, origin)
    return res
  }

  const res = NextResponse.redirect(url, 302)
  setLocaleCookie(res, locale, origin)
  return res
}
