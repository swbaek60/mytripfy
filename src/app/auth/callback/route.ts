import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { setPickupToken } from '../oauth-pickup-store'
import type { StoredCookie } from '../oauth-pickup-store'

const LOCALE_COOKIE = 'mytripfy_oauth_locale'
const BROADCAST_CHANNEL = 'mytripfy_oauth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const { searchParams, origin } = url
  const code = searchParams.get('code')
  const cookieStore = await cookies()

  const fromQuery = searchParams.get('locale')
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = fromQuery || (fromCookie ? decodeURIComponent(fromCookie) : null) || 'en'

  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) {
          list.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            cookiesToSet.push({ name, value, options })
          })
        },
      },
    }
  )

  if (!code) {
    return buildRedirect(false, locale, cookiesToSet, origin)
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    // 모바일에서 새 탭에선 code_verifier 쿠키가 없어 exchange가 실패할 수 있음.
    // BroadcastChannel로 opener에 "이 콜백 URL로 이동하라"고 보내면,
    // opener(로그인 탭)가 그 URL로 이동해 재시도하고, 그 탭에는 verifier가 있어 성공함.
    return buildRetryHtml(url.toString(), locale, origin)
  }

  await supabase
    .from('profiles')
    .update({ preferred_locale: locale, updated_at: new Date().toISOString() })
    .eq('id', data.user.id)

  return buildRedirect(true, locale, cookiesToSet, origin)
}

function buildRedirect(
  success: boolean,
  locale: string,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
  origin: string
) {
  const dest = success
    ? `${origin}/${locale}`
    : `${origin}/${locale}/login?message=Could+not+authenticate+user`

  const isSecure = origin.startsWith('https://')
  const hostname = new URL(origin).hostname
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`

  // 성공 시: 새 탭에 세션 쿠키가 설정되므로, opener가 세션을 받으려면 픽업 URL로 보내야 함.
  if (success) {
    const token = randomUUID()
    const stored: StoredCookie[] = cookiesToSet.map(({ name, value, options }) => {
      const o = (options || {}) as Record<string, unknown>
      return {
        name,
        value,
        path: (o.path as string) ?? '/',
        maxAge: (o.maxAge as number) ?? 400 * 24 * 60 * 60,
        httpOnly: (o.httpOnly as boolean) ?? false,
        secure: (o.secure as boolean) ?? isSecure,
        sameSite: (o.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
        ...(o.domain ? { domain: o.domain as string } : domain ? { domain } : {}),
      }
    })
    setPickupToken(token, stored, locale)
    const pickupUrl = `${origin}/auth/session-pickup?token=${token}`
    const html = buildSuccessHtml(dest, pickupUrl, origin, BROADCAST_CHANNEL)
    const res = new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
    applyCookies(res, cookiesToSet, isSecure, domain)
    res.cookies.set(LOCALE_COOKIE, '', { path: '/', maxAge: 0, secure: isSecure, sameSite: 'lax', ...(domain && { domain }) })
    return res
  }

  const html = buildFailHtml(dest, origin)
  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  applyCookies(res, cookiesToSet, isSecure, domain)
  res.cookies.set(LOCALE_COOKIE, '', { path: '/', maxAge: 0, secure: isSecure, sameSite: 'lax', ...(domain && { domain }) })
  return res
}

/**
 * exchange 실패 시: opener가 이 콜백 URL로 이동하면 그 탭의 쿠키(code_verifier)로 재시도할 수 있음.
 * BroadcastChannel 사용 (Android 등에서 window.opener가 null이어도 동작).
 */
function buildRetryHtml(fullCallbackUrl: string, _locale: string, _origin: string): NextResponse {
  const channel = BROADCAST_CHANNEL
  const urlB64 = Buffer.from(fullCallbackUrl, 'utf-8').toString('base64')
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Redirecting…</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#64748b;font-size:14px;text-align:center}</style>
</head>
<body data-url="${urlB64}">
  <p>Redirecting…</p>
  <script>
    (function () {
      try {
        var url = atob(document.body.getAttribute("data-url") || "");
        var ch = new BroadcastChannel("${channel}");
        ch.postMessage({ type: "oauth_retry", url: url });
        ch.close();
      } catch (e) {}
      setTimeout(function () { try { window.close(); } catch (_) {} }, 500);
    })();
  </script>
</body>
</html>`
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/**
 * 성공 시: BroadcastChannel로 pickupUrl 전달 후, 이 창은 픽업 URL로 이동(같은 탭) 또는 닫기(팝업).
 */
function buildSuccessHtml(dest: string, pickupUrl: string, _origin: string, channel: string): string {
  const pickupB64 = Buffer.from(pickupUrl, 'utf-8').toString('base64')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Signing in…</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#64748b;font-size:14px;text-align:center}</style>
</head>
<body data-pickup="${pickupB64}">
  <div>
    <div style="font-size:2rem;margin-bottom:0.5rem">✅</div>
    <p>Signed in! Redirecting…</p>
  </div>
  <script>
    (function () {
      var pickupUrl = atob(document.body.getAttribute("data-pickup") || "");
      var ch = new BroadcastChannel("${channel}");
      ch.postMessage({ type: "oauth_complete", pickupUrl: pickupUrl, dest: "${dest.replace(/"/g, '&quot;')}" });
      ch.close();
      if (window.opener && !window.opener.closed) {
        setTimeout(function () { try { window.close(); } catch (_) {} }, 300);
      } else {
        window.location.replace(pickupUrl);
      }
    })();
  </script>
</body>
</html>`
}

function buildFailHtml(dest: string, _origin: string): string {
  const destEsc = dest.replace(/"/g, '&quot;')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Signing in…</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#64748b;font-size:14px;text-align:center}</style>
</head>
<body>
  <p>Redirecting…</p>
  <script>window.location.replace("${destEsc}");</script>
</body>
</html>`
}

function applyCookies(
  res: NextResponse,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
  isSecure: boolean,
  domain: string | undefined
) {
  cookiesToSet.forEach(({ name, value, options }) => {
    const o = (options || {}) as Record<string, unknown>
    res.cookies.set(name, value, {
      path: (o.path as string) ?? '/',
      maxAge: (o.maxAge as number) ?? 400 * 24 * 60 * 60,
      httpOnly: (o.httpOnly as boolean) ?? false,
      secure: isSecure,
      sameSite: (o.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
      ...(domain && { domain }),
    })
  })
}
