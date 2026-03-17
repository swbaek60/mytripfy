import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const PROVIDERS = ['google', 'apple', 'facebook'] as const
type Provider = (typeof PROVIDERS)[number]

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
}

function isMobileUserAgent(request: Request): boolean {
  const ua = request.headers.get('user-agent') || ''
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
}

/**
 * GET /api/auth/oauth-start?provider=...&locale=...
 * - 데스크톱: 302 리다이렉트로 OAuth URL로 이동.
 * - 모바일: 200 HTML + location.replace(oauthUrl). 모바일 브라우저가 302를 새 탭으로 따르는 경우를 피하기 위해,
 *   같은 문서에서 replace()로 이동시켜 같은 탭 유지.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider') as Provider | null
  const locale = searchParams.get('locale') || 'en'

  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.redirect(`${getOrigin()}/${locale}/login?message=Invalid+provider`, 302)
  }

  const supabase = await createClient()
  const options: Parameters<typeof supabase.auth.signInWithOAuth>[0]['options'] = {
    redirectTo: `${getOrigin()}/auth/callback?locale=${locale}`,
  }
  if (provider === 'google') {
    options.queryParams = { access_type: 'offline', prompt: 'consent' }
  }
  if (provider === 'facebook') {
    options.queryParams = { display: 'page' }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })

  if (error || !data.url) {
    return NextResponse.redirect(
      `${getOrigin()}/${locale}/login?message=Could+not+authenticate+user`,
      302
    )
  }

  const url = data.url

  if (isMobileUserAgent(request)) {
    const safeUrl = JSON.stringify(url)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting...</title></head><body><p>Redirecting...</p><script>var u=${safeUrl};window.location.replace(u);</script></body></html>`
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return NextResponse.redirect(url, 302)
}
