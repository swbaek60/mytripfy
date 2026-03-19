import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const LOCALE_COOKIE = 'mytripfy_oauth_locale'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
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

  if (!code) return buildRedirect(false, locale, cookiesToSet, origin)

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return buildRedirect(false, locale, cookiesToSet, origin)

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

  // 새 창(window.opener가 있는 경우)에서 OAuth가 완료됐을 때:
  // 원래 탭에 postMessage로 완료 신호를 보내고 새 창을 닫는 HTML을 반환합니다.
  // 원래 탭이 없으면(직접 접근 등) 일반 리다이렉트로 폴백합니다.
  const openerHtml = buildOpenerCloseHtml(dest, locale, origin)
  const htmlRes = new NextResponse(openerHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  applyCookies(htmlRes, cookiesToSet, isSecure, domain)
  htmlRes.cookies.set(LOCALE_COOKIE, '', { path: '/', maxAge: 0, secure: isSecure, sameSite: 'lax', ...(domain && { domain }) })
  return htmlRes
}

/**
 * OAuth 콜백 완료 후 렌더되는 HTML.
 *
 * - window.opener가 있으면: opener에 postMessage 후 새 창 닫기
 * - window.opener가 없으면(같은 탭 이동): dest로 바로 이동
 */
function buildOpenerCloseHtml(dest: string, locale: string, origin: string): string {
  const destEsc = dest.replace(/"/g, '&quot;')
  const originEsc = origin.replace(/"/g, '&quot;')
  const localeEsc = locale.replace(/"/g, '&quot;')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Signing in…</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#64748b;font-size:14px;text-align:center}</style>
</head>
<body>
  <div>
    <div style="font-size:2rem;margin-bottom:0.5rem">✅</div>
    <p>Signed in! Redirecting…</p>
  </div>
  <script>
    (function () {
      var dest = "${destEsc}";
      var origin = "${originEsc}";
      var locale = "${localeEsc}";

      try {
        if (window.opener && !window.opener.closed) {
          // 새 창에서 완료: opener에 신호 보내고 닫기
          window.opener.postMessage(
            { type: 'oauth_complete', locale: locale, dest: dest },
            origin
          );
          // opener가 처리할 시간을 준 뒤 닫기
          setTimeout(function () { window.close(); }, 300);
        } else {
          // 같은 탭에서 완료: 바로 이동
          window.location.replace(dest);
        }
      } catch (e) {
        window.location.replace(dest);
      }
    })();
  </script>
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
