import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const PROVIDERS = ['google', 'apple', 'facebook'] as const
type Provider = (typeof PROVIDERS)[number]
const LOCALE_COOKIE = 'mytripfy_oauth_locale'

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
}

function getCookieOpts(origin: string) {
  if (!origin || typeof origin !== 'string') {
    return { path: '/' as const, sameSite: 'lax' as const, secure: true }
  }
  const isSecure = origin.startsWith('https://')
  let hostname: string
  try {
    hostname = new URL(origin).hostname
  } catch {
    return { path: '/' as const, sameSite: 'lax' as const, secure: isSecure }
  }
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`
  return { path: '/' as const, sameSite: 'lax' as const, secure: isSecure, ...(domain && { domain }) }
}

/**
 * GET /api/auth/oauth-start?provider=...&locale=...
 *
 * Supabase signInWithOAuth를 서버에서 호출해 authorize URL을 받고,
 * 해당 URL로 리다이렉트합니다.
 *
 * Supabase @supabase/ssr이 자동으로 PKCE code_verifier를 쿠키에 저장하므로,
 * 우리가 별도로 PKCE를 생성하거나 code_challenge를 덮어쓰면 안 됩니다.
 */
export async function GET(request: NextRequest) {
  const nextParams = request.nextUrl.searchParams
  let searchParams = nextParams
  if (!nextParams.has('provider')) {
    try { searchParams = new URL(request.url).searchParams } catch { /* ignore */ }
  }

  const providerRaw = searchParams.get('provider') ?? ''
  const provider = providerRaw.trim().toLowerCase() as Provider | ''
  const locale = (searchParams.get('locale') ?? 'en').trim() || 'en'
  const origin = getOrigin()

  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.redirect(`${origin}/${locale}/login?message=Invalid+provider`, 302)
  }

  const supabase = await createClient()
  const options: Parameters<typeof supabase.auth.signInWithOAuth>[0]['options'] = {
    redirectTo: `${origin}/auth/callback?locale=${locale}`,
    skipBrowserRedirect: true,
  }
  if (provider === 'google') {
    options.queryParams = { access_type: 'offline', prompt: 'consent' }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/${locale}/login?message=Could+not+authenticate+user`, 302)
  }

  // locale 쿠키 설정 후 Supabase authorize URL로 직접 리다이렉트
  // Supabase가 이미 code_challenge를 URL에 포함시키고, code_verifier를 쿠키에 저장함
  const isSecure = origin.startsWith('https://')
  const requestHost = request.headers.get('host') || ''
  const protocol = request.nextUrl?.protocol || (isSecure ? 'https:' : 'http:')
  const cookieOrigin = requestHost ? `${protocol}//${requestHost}` : origin
  const cookieOpts = getCookieOpts(cookieOrigin)

  const res = NextResponse.redirect(data.url, 302)
  res.cookies.set(LOCALE_COOKIE, encodeURIComponent(locale), {
    ...cookieOpts,
    maxAge: 300,
  })
  return res
}
