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
 * - form GET submit은 action URL의 쿼리스트링을 버리기 때문에 사용하지 않음.
 * - location.replace()는 새 탭/창을 열지 않고 현재 탭에서 이동.
 * - window.top.location으로 iframe(인앱 브라우저) 탈출.
 */
function buildHtmlRedirect(url: string): string {
  const urlEsc = url.replace(/'/g, "\\'")
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
  <script>
    (function () {
      var url = '${urlEsc}';
      try {
        // iframe(인앱 브라우저) 안에 있으면 최상위 탭에서 이동
        if (window.top && window.top !== window.self) {
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
    <meta http-equiv="refresh" content="0;url=${url}" />
    <a href="${url}">Click here to continue</a>
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
