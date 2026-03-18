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

  const fail = () => redirect(false, locale, cookiesToSet, origin)

  if (!code) return fail()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return fail()

  // OAuth 로그인 시 사용한 언어를 프로필에 저장 (어떤 언어로 연결했는지 반영)
  await supabase
    .from('profiles')
    .update({
      preferred_locale: locale,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.user.id)

  // 저장한 locale로 리다이렉트 (동일 언어 유지)
  return redirect(true, locale, cookiesToSet, origin)
}

function redirect(
  success: boolean,
  locale: string,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
  origin: string
) {
  const dest = success
    ? `${origin}/${locale}`
    : `${origin}/${locale}/login?message=Could+not+authenticate+user`

  const res = NextResponse.redirect(dest)
  const isSecure = origin.startsWith('https://')
  const hostname = new URL(origin).hostname
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`

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

  res.cookies.set(LOCALE_COOKIE, '', { path: '/', maxAge: 0, secure: isSecure, sameSite: 'lax', ...(domain && { domain }) })
  return res
}
