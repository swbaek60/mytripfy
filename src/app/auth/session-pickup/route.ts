import { NextResponse } from 'next/server'
import { getAndDeletePickupToken } from '../oauth-pickup-store'

/**
 * GET /auth/session-pickup?token=xxx
 *
 * 새 탭에서 OAuth가 완료된 뒤, opener(로그인 탭)가 세션을 받기 위해 호출합니다.
 * 토큰으로 저장된 쿠키를 응답에 설정하고 /{locale} 로 리다이렉트합니다.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const origin = new URL(request.url).origin

  if (!token) {
    return NextResponse.redirect(`${origin}/en/login?message=Could+not+authenticate+user`, 302)
  }

  const entry = getAndDeletePickupToken(token)
  if (!entry) {
    return NextResponse.redirect(`${origin}/en/login?message=Could+not+authenticate+user`, 302)
  }

  const dest = `${origin}/${entry.locale}`
  const res = NextResponse.redirect(dest, 302)
  const isSecure = origin.startsWith('https://')
  const hostname = new URL(origin).hostname
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`

  for (const c of entry.cookies) {
    res.cookies.set(c.name, c.value, {
      path: c.path ?? '/',
      maxAge: c.maxAge ?? 400 * 24 * 60 * 60,
      httpOnly: c.httpOnly ?? false,
      secure: c.secure ?? isSecure,
      sameSite: c.sameSite ?? 'lax',
      ...(c.domain !== undefined ? { domain: c.domain } : domain ? { domain } : {}),
    })
  }

  return res
}
