import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { setPickupToken } from '../oauth-pickup-store'
import type { StoredCookie } from '../oauth-pickup-store'

const LOCALE_COOKIE = 'mytripfy_oauth_locale'
const PKCE_VERIFIER_COOKIE = 'mytripfy_pkce_verifier'
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

  let data: { user: unknown } | null = null
  let error: unknown = null
  const first = await supabase.auth.exchangeCodeForSession(code)
  data = first.data
  error = first.error

  if (error || !data?.user) {
    // 모바일 새 탭: 우리가 설정한 PKCE verifier 쿠키가 있으면 그걸로 exchange 시도
    const verifierFromCookie = cookieStore.get(PKCE_VERIFIER_COOKIE)?.value
    if (verifierFromCookie) {
      const second = await (supabase.auth as { exchangeCodeForSession: (a: string, b?: string) => Promise<{ data: { user: unknown }; error: unknown }> }).exchangeCodeForSession(code, verifierFromCookie)
      if (second.data?.user && !second.error) {
        data = second.data
        error = null
      }
    }
  }

  if (error || !data?.user) {
    return buildRetryHtml(url.toString(), locale, origin)
  }

  const userId = (data as { user: { id: string } }).user.id
  await supabase
    .from('profiles')
    .update({ preferred_locale: locale, updated_at: new Date().toISOString() })
    .eq('id', userId)

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
    res.cookies.set(PKCE_VERIFIER_COOKIE, '', { path: '/', maxAge: 0, secure: isSecure, sameSite: 'lax', ...(domain && { domain }) })
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

const STORAGE_KEY_RETRY = 'mytripfy_oauth_retry_url'
const STORAGE_KEY_RETRY_TS = 'mytripfy_oauth_retry_ts'
const STORAGE_KEY_PICKUP = 'mytripfy_oauth_pickup_url'
const STORAGE_KEY_PICKUP_TS = 'mytripfy_oauth_pickup_ts'
const STORAGE_TTL_MS = 2 * 60 * 1000

const VERIFIER_STORAGE_KEY = 'mytripfy_oauth_code_verifier'

/**
 * exchange 실패 시:
 * 1) localStorage에 code_verifier가 있으면(클라이언트 PKCE) 이 탭에서 바로 POST /api/auth/exchange로 완료.
 * 2) 없으면 BroadcastChannel + localStorage로 다른 탭에 콜백 URL 전달 (기존 폴백).
 */
function buildRetryHtml(fullCallbackUrl: string, _locale: string, origin: string): NextResponse {
  const channel = BROADCAST_CHANNEL
  const urlB64 = Buffer.from(fullCallbackUrl, 'utf-8').toString('base64')
  const exchangeUrl = `${origin}/api/auth/exchange`
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Complete sign-in</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#334155;font-size:15px;text-align:center;padding:24px;box-sizing:border-box}
  .box{max-width:360px}
  .msg{margin-top:12px;line-height:1.5;color:#64748b}
  .hint{margin-top:20px;font-size:13px;color:#94a3b8}
  .loading{color:#64748b;margin-top:12px}</style>
</head>
<body data-url="${urlB64}" data-exchange="${exchangeUrl.replace(/"/g, '&quot;')}">
  <div class="box">
    <div style="font-size:2.5rem">↩️</div>
    <p class="msg"><strong>Almost there</strong><br><span id="status">Completing sign-in…</span></p>
    <p class="hint" id="hint" style="display:none">You can close this tab after switching.</p>
  </div>
  <script>
    (function () {
      var url = "";
      try { url = atob(document.body.getAttribute("data-url") || ""); } catch (e) {}
      var exchangeApi = document.body.getAttribute("data-exchange") || "";
      var code = "";
      try { code = new URL(url).searchParams.get("code") || ""; } catch (e) {}
      var verifier = "";
      try { verifier = localStorage.getItem("${VERIFIER_STORAGE_KEY}") || ""; } catch (e) {}

      function fallback() {
        var status = document.getElementById("status");
        var hint = document.getElementById("hint");
        if (status) status.textContent = "Switch back to the tab where you started login. Sign-in will complete there.";
        if (hint) hint.style.display = "block";
        try {
          localStorage.setItem("${STORAGE_KEY_RETRY}", url);
          localStorage.setItem("${STORAGE_KEY_RETRY_TS}", String(Date.now()));
        } catch (e) {}
        try {
          var ch = new BroadcastChannel("${channel}");
          ch.postMessage({ type: "oauth_retry", url: url });
          ch.close();
        } catch (e) {}
        setTimeout(function () { try { window.close(); } catch (_) {} }, 800);
      }

      if (code && verifier && exchangeApi) {
        fetch(exchangeApi, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code, code_verifier: verifier })
        }).then(function (r) {
          if (r.ok) return r.json();
          throw new Error("Exchange failed");
        }).then(function (d) {
          try { localStorage.removeItem("${VERIFIER_STORAGE_KEY}"); localStorage.removeItem("mytripfy_oauth_code_verifier_ts"); } catch (e) {}
          if (d && d.pickupUrl) { window.location.replace(d.pickupUrl); return; }
          fallback();
        }).catch(function () { fallback(); });
      } else {
        fallback();
      }
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
 * 성공 시: BroadcastChannel + localStorage로 pickupUrl 전달. 이 창은 픽업으로 이동 또는 닫기.
 * 모바일에서 창이 안 닫히면 "이전 탭으로 돌아가라" 안내 표시.
 */
function buildSuccessHtml(dest: string, pickupUrl: string, _origin: string, channel: string): string {
  const pickupB64 = Buffer.from(pickupUrl, 'utf-8').toString('base64')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Signed in</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#334155;font-size:15px;text-align:center;padding:24px;box-sizing:border-box}
  .box{max-width:360px}
  .msg{margin-top:12px;line-height:1.5;color:#64748b}
  .hint{margin-top:20px;font-size:13px;color:#94a3b8}</style>
</head>
<body data-pickup="${pickupB64}">
  <div class="box">
    <div style="font-size:2.5rem">✅</div>
    <p class="msg"><strong>Signed in!</strong><br>Switch back to the previous tab to continue. You can close this tab.</p>
    <p class="hint">If nothing happens there, we will redirect in a moment.</p>
  </div>
  <script>
    (function () {
      var pickupUrl = atob(document.body.getAttribute("data-pickup") || "");
      try {
        localStorage.setItem("${STORAGE_KEY_PICKUP}", pickupUrl);
        localStorage.setItem("${STORAGE_KEY_PICKUP_TS}", String(Date.now()));
      } catch (e) {}
      var ch = new BroadcastChannel("${channel}");
      ch.postMessage({ type: "oauth_complete", pickupUrl: pickupUrl, dest: "${dest.replace(/"/g, '&quot;')}" });
      ch.close();
      if (window.opener && !window.opener.closed) {
        setTimeout(function () { try { window.close(); } catch (_) {} }, 500);
      } else {
        setTimeout(function () { window.location.replace(pickupUrl); }, 1500);
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
