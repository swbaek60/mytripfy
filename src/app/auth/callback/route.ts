import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** OAuth 콜백: 세션 설정 후 /{locale} 또는 /{locale}/login 으로 리다이렉트 (모바일·데스크탑 동일) */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const cookieStore = await cookies()
  // URL의 locale이 Supabase 리다이렉트로 빠질 수 있음 → 로그인 직전에 저장한 쿠키 사용
  const savedLocale = cookieStore.get('mytripfy_fb_locale')?.value
  const fallbackLocale = searchParams.get('locale') || (savedLocale ? decodeURIComponent(savedLocale) : null) || 'en'

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
    // Supabase가 ?code= 대신 #access_token=...#refresh_token= (해시)로 보낼 수 있음. 해시는 서버에 오지 않으므로
    // HTML을 내려보내 클라이언트에서 해시를 파싱해 setSession 후 리다이렉트함.
    return new NextResponse(
      buildFragmentHandlerHtml(origin, fallbackLocale),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return buildRedirect(false, fallbackLocale, cookiesToSet, origin)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_locale')
    .eq('id', data.user.id)
    .single()
  const redirectLocale = (profile?.preferred_locale as string) || fallbackLocale

  return buildRedirect(true, redirectLocale, cookiesToSet, origin)
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

/** 해시(#access_token=...&refresh_token=...)로 온 토큰을 서버에 보내 세션(쿠키) 설정. 팝업이면 postMessage+close, 아니면 /locale 리다이렉트 */
function buildFragmentHandlerHtml(origin: string, locale: string): string {
  const failUrl = `${origin}/${locale}/login?message=Could+not+authenticate+user`
  const doneUrl = `${origin}/auth/callback/done?locale=${encodeURIComponent(locale)}`
  const localeEsc = locale.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const originEsc = origin.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const failEsc = failUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const doneEsc = doneUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing in...</title></head><body><p>Signing in...</p>
<script>
(function() {
  var hash = window.location.hash.slice(1);
  if (!hash) { window.location.replace("${failEsc}"); return; }
  var params = {};
  hash.split('&').forEach(function(p) {
    var i = p.indexOf('=');
    if (i === -1) return;
    params[decodeURIComponent(p.slice(0, i))] = decodeURIComponent((p.slice(i + 1) || '').replace(/\\+/g, ' '));
  });
  var access_token = params.access_token;
  var refresh_token = params.refresh_token;
  if (!access_token || !refresh_token) { window.location.replace("${failEsc}"); return; }
  var _locale = "${localeEsc}";
  var _origin = "${originEsc}";
  fetch("/api/auth/set-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: access_token, refresh_token: refresh_token })
  }).then(function(r) {
    if (r.ok) {
      if (window.opener) {
        try { window.opener.postMessage({ type: "mytripfy_oauth_done", locale: _locale }, _origin); } catch(e) {}
        window.close();
      } else {
        window.location.replace("${doneEsc}");
      }
    } else {
      window.location.replace("${failEsc}");
    }
  }).catch(function() { window.location.replace("${failEsc}"); });
})();
</script></body></html>`
}

function buildRedirect(
  success: boolean,
  locale: string,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
  origin: string
) {
  // 성공 시 /auth/callback/done으로 보내서, 팝업이면 postMessage+close / 같은 탭이면 /locale 리다이렉트 처리
  const dest = success
    ? `${origin}/auth/callback/done?locale=${encodeURIComponent(locale)}`
    : `${origin}/${locale}/login?message=Could+not+authenticate+user`
  const response = NextResponse.redirect(dest)
  applySessionCookies(response, cookiesToSet, origin)
  // 사용한 locale 쿠키 삭제 (1회용)
  const url = new URL(origin)
  const domain = url.hostname === 'localhost' ? undefined : `.${url.hostname.replace(/^www\./, '')}`
  response.cookies.set('mytripfy_fb_locale', '', {
    path: '/',
    maxAge: 0,
    secure: origin.startsWith('https://'),
    sameSite: 'lax',
    ...(domain && { domain }),
  })
  return response
}
