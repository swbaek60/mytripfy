import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** OAuth 콜백: 항상 "닫기 HTML"을 반환합니다.
 * - 팝업/새 탭에서 열렸으면 (window.opener 있음) → postMessage 후 창 닫기 (트립닷컴처럼)
 * - 같은 탭이면 → location으로 이동
 * Supabase/Facebook 리다이렉트가 query를 제거할 수 있어, popup=1에 의존하지 않습니다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const fallbackLocale = searchParams.get('locale') || 'en'

  const cookieStore = await cookies()
  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSetFromSupabase) {
          cookiesToSetFromSupabase.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            cookiesToSet.push({ name, value, options })
          })
        },
      },
    }
  )

  if (!code) {
    return buildClosingHtml(false, fallbackLocale, cookiesToSet, origin)
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return buildClosingHtml(false, fallbackLocale, cookiesToSet, origin)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_locale')
    .eq('id', data.user.id)
    .single()
  const redirectLocale = (profile?.preferred_locale as string) || fallbackLocale

  return buildClosingHtml(true, redirectLocale, cookiesToSet, origin)
}

function applySessionCookies(
  response: NextResponse,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
  origin: string
) {
  const isSecure = origin.startsWith('https://')
  const url = new URL(origin)
  const domain = url.hostname === 'localhost' ? undefined : `.${url.hostname.replace(/^www\./, '')}`
  cookiesToSet.forEach(({ name, value, options }) => {
    const opts = (options || {}) as Record<string, unknown>
    response.cookies.set(name, value, {
      path: (opts.path as string) ?? '/',
      maxAge: (opts.maxAge as number) ?? 400 * 24 * 60 * 60,
      httpOnly: (opts.httpOnly as boolean) ?? false,
      secure: isSecure,
      sameSite: (opts.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
      ...(domain && { domain }),
    })
  })
}

/** 트립닷컴처럼: 팝업이면 postMessage 후 바로 닫기, 같은 탭이면 location 이동 */
function buildClosingHtml(
  success: boolean,
  locale: string,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
  origin: string
) {
  const redirectPath = success ? `/${locale}` : `/${locale}/login?message=Could+not+authenticate+user`
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Signing in...</title></head>
<body>
<script>
(function() {
  var msg = { type: 'FACEBOOK_AUTH_COMPLETE', success: ${success}, locale: '${locale}' };
  if (window.opener) {
    try { window.opener.postMessage(msg, '${origin}'); } catch (e) {}
    window.close();
  } else {
    window.location.replace('${origin}${redirectPath}');
  }
})();
</script>
<p style="font-family:sans-serif;text-align:center;margin-top:40px;color:#666;">Signing in...</p>
</body>
</html>`

  const response = new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  applySessionCookies(response, cookiesToSet, origin)
  return response
}
