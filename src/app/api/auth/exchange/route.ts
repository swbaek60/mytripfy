import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { setPickupToken } from '@/app/auth/oauth-pickup-store'
import type { StoredCookie } from '@/app/auth/oauth-pickup-store'

const LOCALE_COOKIE = 'mytripfy_oauth_locale'

function getOrigin(req: NextRequest): string {
  try {
    return new URL(req.url).origin
  } catch {
    const host = req.headers.get('host') || ''
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
}

export async function POST(request: NextRequest) {
  const origin = getOrigin(request)
  let body: { code?: string; code_verifier?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const code = typeof body.code === 'string' ? body.code.trim() : null
  const codeVerifier = typeof body.code_verifier === 'string' ? body.code_verifier.trim() : null
  if (!code || !codeVerifier) {
    return NextResponse.json({ error: 'code and code_verifier required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = fromCookie ? decodeURIComponent(fromCookie) : 'en'

  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(list) {
          list.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            cookiesToSet.push({ name, value, options })
          })
        },
      },
    }
  )

  // PKCE: code_verifier 2인자 지원 (타입 정의는 1인자만 있음)
  const { data, error } = await (supabase.auth as { exchangeCodeForSession: (code: string, codeVerifier?: string) => ReturnType<typeof supabase.auth.exchangeCodeForSession> }).exchangeCodeForSession(code, codeVerifier)

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || 'Exchange failed' },
      { status: 400 }
    )
  }

  await supabase
    .from('profiles')
    .update({ preferred_locale: locale, updated_at: new Date().toISOString() })
    .eq('id', data.user.id)

  const isSecure = origin.startsWith('https://')
  const hostname = new URL(origin).hostname
  const domain = hostname === 'localhost' ? undefined : `.${hostname.replace(/^www\./, '')}`

  const token = randomUUID()
  const stored: StoredCookie[] = cookiesToSet.map(({ name, value, options }) => {
    const o = (options || {}) as Record<string, unknown>
    return {
      name,
      value,
      path: (o.path as string) ?? '/',
      maxAge: (o.maxAge as number) ?? 400 * 24 * 60 * 60,
      httpOnly: (o.httpOnly as boolean) ?? false,
      secure: (o.secure as boolean) ?? isSecure,
      sameSite: (o.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
      ...(o.domain ? { domain: o.domain as string } : domain ? { domain } : {}),
    }
  })
  setPickupToken(token, stored, locale)
  const pickupUrl = `${origin}/auth/session-pickup?token=${token}`
  const dest = `${origin}/${locale}`

  return NextResponse.json({ pickupUrl, dest })
}
