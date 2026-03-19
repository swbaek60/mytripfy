import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const PROVIDERS = ['google', 'apple', 'facebook'] as const
type Provider = (typeof PROVIDERS)[number]
const LOCALE_COOKIE = 'mytripfy_oauth_locale'

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
}

function getCookieOpts(origin: string) {
  const isSecure = origin.startsWith('https://')
  const hostname = new URL(origin).hostname
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`
  return { path: '/' as const, sameSite: 'lax' as const, secure: isSecure, ...(domain && { domain }) }
}

function setLocaleCookie(res: NextResponse, locale: string, origin: string) {
  res.cookies.set(LOCALE_COOKIE, encodeURIComponent(locale), {
    ...getCookieOpts(origin),
    maxAge: 300,
  })
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Supabase authorize URL을 form GET으로 제출하는 HTML을 생성합니다.
 *
 * form method="GET"은 action URL의 쿼리를 무시하므로,
 * 쿼리 파라미터를 모두 hidden input으로 분해해 전달합니다.
 */
function buildOAuthRedirectHtml(supabaseUrl: string): string {
  const parsed = new URL(supabaseUrl)
  const actionBase = esc(`${parsed.protocol}//${parsed.host}${parsed.pathname}`)
  const hiddenInputs = Array.from(parsed.searchParams.entries())
    .map(([k, v]) => `  <input type="hidden" name="${esc(k)}" value="${esc(v)}" />`)
    .join('\n')
  const fullUrlEsc = esc(supabaseUrl)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Redirecting…</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#64748b;font-size:14px}</style>
</head>
<body>
  <p>Redirecting…</p>
  <form id="oauthForm" method="GET" action="${actionBase}" target="_self">
${hiddenInputs}
  </form>
  <script>
    (function () {
      var f = document.getElementById('oauthForm');
      try { if (window.top !== window.self) f.target = '_top'; } catch (_) {}
      f.submit();
    })();
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${fullUrlEsc}" />
    <a href="${fullUrlEsc}">Continue</a>
  </noscript>
</body>
</html>`
}

/**
 * GET /api/auth/oauth-start?provider=...&locale=...
 *
 * Supabase에서 OAuth authorize URL을 받아 form GET으로 이동시킵니다.
 * 모바일/데스크톱 구분 없이 동일하게 처리합니다.
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

  const html = buildOAuthRedirectHtml(data.url)
  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  setLocaleCookie(res, locale, origin)
  return res
}
