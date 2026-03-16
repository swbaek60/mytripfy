import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** OAuth 콜백: exchangeCodeForSession 후 쿠키를 리다이렉트 응답에 명시적으로 붙여서
 * Next.js Route Handler에서 세션 쿠키가 빠지는 문제를 방지합니다.
 *
 * popup=1 파라미터가 있으면 팝업/새 탭 모드: 세션 설정 후 postMessage로 부모 창에 알리고 닫힘.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const fallbackLocale = searchParams.get('locale') || 'en'
  const isPopup = searchParams.get('popup') === '1'

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
    if (isPopup) return buildPopupResponse(false, fallbackLocale, cookiesToSet, origin)
    return NextResponse.redirect(`${origin}/${fallbackLocale}/login?message=Could not authenticate user`)
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    if (isPopup) return buildPopupResponse(false, fallbackLocale, cookiesToSet, origin)
    return NextResponse.redirect(`${origin}/${fallbackLocale}/login?message=Could not authenticate user`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_locale')
    .eq('id', data.user.id)
    .single()
  const redirectLocale = (profile?.preferred_locale as string) || fallbackLocale

  if (isPopup) return buildPopupResponse(true, redirectLocale, cookiesToSet, origin)

  const redirectUrl = `${origin}/${redirectLocale}`
  const response = NextResponse.redirect(redirectUrl)
  applySessionCookies(response, cookiesToSet, origin)
  return response
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

/** 팝업/새 탭 모드: postMessage로 부모 창에 결과를 알리고 자신을 닫는 HTML 반환 */
function buildPopupResponse(
  success: boolean,
  locale: string,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
  origin: string
) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authenticating...</title></head>
<body>
<script>
  (function() {
    var msg = { type: 'FACEBOOK_AUTH_COMPLETE', success: ${success}, locale: '${locale}' };
    if (window.opener) {
      window.opener.postMessage(msg, '${origin}');
      window.close();
    } else {
      // 새 탭에서 opener가 없는 경우 (모바일): 직접 이동
      window.location.href = '${origin}/${locale}' + (${success} ? '' : '/login?message=Could+not+authenticate+user');
    }
  })();
</script>
<p style="font-family:sans-serif;text-align:center;margin-top:40px;color:#666;">
  Completing sign in...
</p>
</body>
</html>`

  const response = new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  applySessionCookies(response, cookiesToSet, origin)
  return response
}
