import { NextResponse } from 'next/server'

/**
 * Facebook 로그인: Supabase /auth/v1/authorize 로 보낼 URL을 직접 생성합니다.
 * signInWithOAuth 반환 URL은 provider가 비어 있을 수 있어 400 "Provider could not be found"가 나므로,
 * 항상 수동 URL만 사용해 provider=facebook 과 apikey 를 확실히 넣습니다.
 */
const FACEBOOK_PROVIDER = 'facebook'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') || 'en'
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      {
        error:
          'Facebook 로그인 URL을 만들 수 없습니다. NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수를 확인해 주세요.',
      },
      { status: 500 }
    )
  }

  const redirectTo = `${origin}/auth/callback?locale=${locale}`
  const base = supabaseUrl.replace(/\/$/, '')
  const authorizeUrl = new URL(`${base}/auth/v1/authorize`)

  authorizeUrl.searchParams.set('provider', FACEBOOK_PROVIDER)
  authorizeUrl.searchParams.set('redirect_to', redirectTo)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scopes', 'email,public_profile')
  authorizeUrl.searchParams.set('apikey', anonKey)

  const url = authorizeUrl.toString()
  if (!url.includes('provider=facebook') || !url.includes('apikey=')) {
    return NextResponse.json(
      { error: 'authorize URL에 provider 또는 apikey가 포함되지 않았습니다.' },
      { status: 500 }
    )
  }

  // redirect=1 이면 200 + HTML로 같은 탭에서 location.replace (모바일에서 302 시 새 창으로 뜨는 경우 방지)
  const doRedirect = searchParams.get('redirect') === '1'
  if (doRedirect) {
    const urlEsc = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>var u="${urlEsc}";location.replace(u);</script></body></html>`
    const res = new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
    const isSecure = origin.startsWith('https://')
    const host = new URL(origin).hostname
    const domain = host === 'localhost' ? undefined : `.${host.replace(/^www\./, '')}`
    res.cookies.set('mytripfy_fb_locale', encodeURIComponent(locale), {
      path: '/',
      maxAge: 300,
      sameSite: 'lax',
      secure: isSecure,
      ...(domain && { domain }),
    })
    return res
  }

  return NextResponse.json({ url })
}
