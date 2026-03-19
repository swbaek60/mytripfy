import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAdminClientSafe } from '@/utils/supabase/server'
import { randomBytes, createHash } from 'crypto'
import { randomUUID } from 'crypto'
import { setVerifier, setVerifierDb } from '@/app/auth/oauth-verifier-store'

const PROVIDERS = ['google', 'apple', 'facebook'] as const
type Provider = (typeof PROVIDERS)[number]
const LOCALE_COOKIE = 'mytripfy_oauth_locale'
const PKCE_VERIFIER_COOKIE = 'mytripfy_pkce_verifier'

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

function setLocaleCookie(res: NextResponse, locale: string, origin: string) {
  res.cookies.set(LOCALE_COOKIE, encodeURIComponent(locale), {
    ...getCookieOpts(origin),
    maxAge: 300,
  })
}

/** 서버에서 PKCE code_verifier + code_challenge 생성 (클라이언트가 안 보낸 경우용) */
function generateServerPkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
  return { codeVerifier, codeChallenge }
}

function setPkceVerifierCookie(res: NextResponse, codeVerifier: string, origin: string) {
  res.cookies.set(PKCE_VERIFIER_COOKIE, codeVerifier, {
    ...getCookieOpts(origin),
    maxAge: 300,
    httpOnly: true,
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
  // 쿠키는 실제 요청 Host 기준으로 설정 (www vs non-www 일치). protocol이 없으면 origin 사용
  const requestHost = request.headers.get('host') || ''
  const protocol = request.nextUrl?.protocol || (origin.startsWith('https') ? 'https:' : 'http:')
  const cookieOrigin = requestHost ? `${protocol}//${requestHost}` : origin

  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.redirect(`${origin}/${locale}/login?message=Invalid+provider`, 302)
  }

  const flowId = randomUUID()
  const { codeVerifier, codeChallenge: serverChallenge } = generateServerPkce()
  const admin = getAdminClientSafe()
  if (admin) {
    await setVerifierDb(flowId, codeVerifier, admin)
  } else {
    setVerifier(flowId, codeVerifier)
  }

  const supabase = await createClient()
  const options: Parameters<typeof supabase.auth.signInWithOAuth>[0]['options'] = {
    redirectTo: `${origin}/auth/callback?locale=${locale}&flow_id=${flowId}`,
    skipBrowserRedirect: true,
  }
  if (provider === 'google') {
    options.queryParams = { access_type: 'offline', prompt: 'consent' }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/${locale}/login?message=Could+not+authenticate+user`, 302)
  }

  const u = new URL(data.url)
  u.searchParams.set('code_challenge', serverChallenge)
  u.searchParams.set('code_challenge_method', 'S256')
  const finalUrl = u.toString()

  const res = new NextResponse(buildOAuthRedirectHtml(finalUrl), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  setLocaleCookie(res, locale, origin)
  setPkceVerifierCookie(res, codeVerifier, cookieOrigin)
  return res
}
