import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const PROVIDERS = ['google', 'apple', 'facebook'] as const
type Provider = (typeof PROVIDERS)[number]

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
}

/**
 * GET /api/auth/oauth-start?provider=facebook|google|apple&locale=en
 * OAuth URL을 만들어 302로 리다이렉트. 링크 클릭 → 이 경로 → 302 → 같은 탭에서만 이동하므로 새 창 방지.
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

  return NextResponse.redirect(data.url, 302)
}
