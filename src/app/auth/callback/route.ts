import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** OAuth 콜백: 세션 설정 후 /{locale} 또는 /{locale}/login 으로 리다이렉트 (모바일·데스크탑 동일) */
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
    return buildRedirect(false, fallbackLocale, cookiesToSet, origin)
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

function buildRedirect(
  success: boolean,
  locale: string,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
  origin: string
) {
  const dest = success
    ? `${origin}/${locale}`
    : `${origin}/${locale}/login?message=Could+not+authenticate+user`
  const response = NextResponse.redirect(dest)
  applySessionCookies(response, cookiesToSet, origin)
  return response
}
