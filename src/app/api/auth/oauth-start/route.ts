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

function isMobileUserAgent(ua: string) {
  // 모바일 브라우저에서 OAuth 이동 시 새 탭/팝업으로 취급되는 케이스가 있어,
  // 특정 흐름을 모바일에서만 다르게 처리합니다.
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}

/**
 * Supabase authorize URL의 쿼리 파라미터를 모두 hidden input으로 분해해 form에 넣습니다.
 *
 * 주의: form method="GET"은 action URL의 쿼리를 무시하고 form 필드만 전송합니다.
 * 따라서 action에는 base URL(경로만), 쿼리는 모두 hidden input으로 넣어야 합니다.
 */
function buildHtmlRedirect(supabaseUrl: string): string {
  const parsed = new URL(supabaseUrl)
  // action에는 쿼리 제거한 base만 (scheme+host+path)
  const actionBase = `${parsed.protocol}//${parsed.host}${parsed.pathname}`
  const actionEsc = esc(actionBase)

  // 쿼리 파라미터를 hidden input으로 변환
  const hiddenInputs = Array.from(parsed.searchParams.entries())
    .map(([k, v]) => `  <input type="hidden" name="${esc(k)}" value="${esc(v)}" />`)
    .join('\n')

  // noscript용 전체 URL
  const fullUrlEsc = esc(supabaseUrl)

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
  <form id="oauthForm" method="GET" action="${actionEsc}" target="_self">
${hiddenInputs}
  </form>
  <script>
    (function () {
      var form = document.getElementById('oauthForm');
      try {
        if (window.top !== window.self) form.target = '_top';
        form.submit();
      } catch (e) {
        form.submit();
      }
    })();
  </script>
  <  noscript>
    <meta http-equiv="refresh" content="0;url=${fullUrlEsc}" />
    <a href="${fullUrlEsc}" target="_self">Continue</a>
  </noscript>
</body>
</html>`
}

/**
 * GET /api/auth/oauth-start?provider=...&locale=...
 *
 * 1) Supabase에서 authorize URL을 받아서
 * 2) 그 URL을 form hidden input으로 분해해 자동 submit
 *
 * form method="GET"에서 action URL 쿼리가 사라지는 브라우저 동작을 피하기 위해
 * 쿼리 파라미터를 hidden input으로 분해해서 전달합니다.
 */
export async function GET(request: NextRequest) {
  // nextUrl.searchParams 우선, 없으면 request.url 직접 파싱 (프록시 환경 대비)
  const nextParams = request.nextUrl.searchParams
  let searchParams = nextParams
  if (!nextParams.has('provider')) {
    try {
      searchParams = new URL(request.url).searchParams
    } catch {
      /* ignore */
    }
  }

  const providerRaw = searchParams.get('provider') ?? ''
  const provider = providerRaw.trim().toLowerCase() as Provider | ''
  const locale = (searchParams.get('locale') ?? 'en').trim() || 'en'
  const origin = getOrigin()
  const ua = request.headers.get('user-agent') ?? ''
  const mobile = isMobileUserAgent(ua)

  // 서버 로그: 실제로 어떤 값이 들어오는지 확인
  console.log('[oauth-start] provider=%o locale=%o url=%s', provider, locale, request.url)

  if (!provider || !PROVIDERS.includes(provider)) {
    console.warn('[oauth-start] invalid provider:', JSON.stringify(providerRaw))
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

  console.log('[oauth-start] supabase url:', data.url.slice(0, 80) + '…')

  // 모바일 + Facebook: 서버에서 Facebook URL을 fetch해 form으로 제출하면 Facebook에서 Invalid App ID가 뜨는 경우가 있음.
  // 데스크톱과 동일하게 Supabase authorize URL로 form 제출 후, Supabase가 Facebook으로 리다이렉트하도록 함.
  const html = buildHtmlRedirect(data.url)
  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  setLocaleCookie(res, locale, origin)
  return res
}
