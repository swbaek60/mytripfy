import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const LOCALE_COOKIE = 'mytripfy_oauth_locale'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const { searchParams, origin } = url
  const code = searchParams.get('code')
  const cookieStore = await cookies()

  const fromQuery = searchParams.get('locale')
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = fromQuery || (fromCookie ? decodeURIComponent(fromCookie) : null) || 'en'

  const isSecure = origin.startsWith('https://')
  const hostname = new URL(origin).hostname
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`

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
    return NextResponse.redirect(`${origin}/${locale}/login?message=Could+not+authenticate+user`)
  }

  // Supabase @supabase/ssr이 쿠키에서 code_verifier를 자동으로 읽어 exchange 처리
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.user) {
    console.error('[callback] exchangeCodeForSession failed:', error)
    return NextResponse.redirect(`${origin}/${locale}/login?message=Could+not+authenticate+user`)
  }

  // locale 업데이트
  try {
    await supabase
      .from('profiles')
      .update({ preferred_locale: locale, updated_at: new Date().toISOString() })
      .eq('id', data.user.id)
  } catch { /* 무시 */ }

  // 세션 쿠키를 응답에 설정하고 홈으로 리다이렉트
  const dest = `${origin}/${locale}`
  const res = NextResponse.redirect(dest)

  // locale 쿠키 삭제
  res.cookies.set(LOCALE_COOKIE, '', {
    path: '/',
    maxAge: 0,
    secure: isSecure,
    sameSite: 'lax',
    ...(domain && { domain }),
  })

  // Supabase가 setAll로 설정한 세션 쿠키들을 응답에 적용
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

  return res
}
