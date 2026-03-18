import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const PROVIDERS = ['google', 'apple', 'facebook'] as const
type Provider = (typeof PROVIDERS)[number]
const LOCALE_COOKIE = 'mytripfy_oauth_locale'
const OAUTH_NEXT_COOKIE = 'mytripfy_oauth_next'

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

/**
 * OAuth URL로 같은 탭 이동: form GET + target="_self" + 자동 submit.
 * 모바일 Chrome/Firefox 등에서 location.replace()가 새 탭으로 열리는 문제를 피하기 위해
 * form 제출로 이동 (다른 사이트들에서 사용하는 방식).
 */
function buildHtmlRedirect(url: string): string {
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
  <form id="oauthForm" method="GET" action="${urlAttr}" target="_self"></form>
  <script>
    (function () {
      var form = document.getElementById('oauthForm');
      try {
        if (window.top !== window.self) {
          form.target = '_top';
        }
        form.submit();
      } catch (e) {
        form.submit();
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

  // 모바일: 302로 외부(Supabase→Facebook) 보내면 갤럭시 Chrome/Firefox에서 새 탭이 뜨는 경우가 있음.
  // 같은 탭 유지를 위해 우리 도메인 중간 페이지(/auth/oauth-go)로 보낸 뒤, 그 페이지에서 location.replace()로 이동.
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  if (isMobile) {
    const nextUrl = Buffer.from(data.url, 'utf-8').toString('base64url')
    const res = NextResponse.redirect(`${origin}/auth/oauth-go`, 302)
    setLocaleCookie(res, locale, origin)
    res.cookies.set(OAUTH_NEXT_COOKIE, nextUrl, {
      ...getCookieOpts(origin),
      maxAge: 60,
      httpOnly: true,
    })
    return res
  }

  const html = buildHtmlRedirect(data.url)
  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  setLocaleCookie(res, locale, origin)
  return res
}
