import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const PROVIDERS = ['google', 'apple', 'facebook'] as const
type Provider = (typeof PROVIDERS)[number]
const LOCALE_COOKIE = 'mytripfy_oauth_locale'

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
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
 * location.replace()로 OAuth URL로 이동하는 HTML 응답을 반환.
 * - 같은 탭에서만 이동하도록, window.location.replace 사용 (새 창/탭 없음).
 * - 모바일(특히 페이스북)에서 동일 탭 유지를 위해 base target="_self" 명시.
 */
function buildHtmlRedirect(url: string): string {
  const urlEsc = url.replace(/'/g, "\\'").replace(/</g, '\\u003c')
  const urlAttr = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <base target="_self">
  <title>Redirecting…</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#64748b;font-size:14px}</style>
</head>
<body>
  <p>Redirecting…</p>
  <script>
    (function () {
      var url = '${urlEsc}';
      try {
        if (window.top !== window.self) {
          window.top.location.replace(url);
        } else {
          window.location.replace(url);
        }
      } catch (e) {
        window.location.replace(url);
      }
    })();
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${urlAttr}" />
    <a href="${urlAttr}" target="_self">Continue</a>
  </noscript>
</body>
</html>`
}

/**
 * GET /api/auth/oauth-start?provider=...&locale=...
 *
 * 모든 환경(데스크톱/모바일/인앱브라우저)에서 HTML form submit으로 OAuth 시작.
 * 302 redirect를 쓰지 않으므로 브라우저가 새 탭을 여는 일이 없음.
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
    skipBrowserRedirect: true,
  }
  if (provider === 'google') {
    options.queryParams = { access_type: 'offline', prompt: 'consent' }
  }
  if (provider === 'facebook') {
    options.queryParams = { display: 'page' }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })

  if (error || !data.url) {
    console.error('[oauth-start] Supabase error:', error?.message, 'provider:', provider)
    return NextResponse.redirect(`${origin}/${locale}/login?message=Could+not+authenticate+user`, 302)
  }

  const html = buildHtmlRedirect(data.url)
  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  setLocaleCookie(res, locale, origin)
  return res
}
