import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'mytripfy_pkce_verifier'
const MAX_AGE = 300 // 5분

/**
 * OAuth 시작 전 클라이언트가 code_verifier를 이 API로 보내면 쿠키로 설정합니다.
 * 콜백이 새 탭에서 열려도 같은 브라우저면 쿠키가 전송되므로, 콜백에서 exchange 가능.
 */
export async function POST(request: NextRequest) {
  let body: { code_verifier?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const verifier = typeof body.code_verifier === 'string' ? body.code_verifier.trim() : null
  if (!verifier || verifier.length < 43) {
    return NextResponse.json({ error: 'code_verifier required' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  const host = request.headers.get('host') || ''
  const isSecure = request.headers.get('x-forwarded-proto') === 'https' || !host.includes('localhost')
  const hostname = host.split(':')[0]
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`

  res.cookies.set(COOKIE_NAME, verifier, {
    path: '/',
    maxAge: MAX_AGE,
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    ...(domain && domain !== 'localhost' && { domain: `.${domain}` }),
  })

  return res
}
