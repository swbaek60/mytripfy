import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') || 'en'
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'

  const supabase = await createClient()
  const redirectTo = `${origin}/auth/callback?locale=${locale}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo,
      queryParams: { display: 'page' },
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) {
    return NextResponse.json({ error: 'Could not generate OAuth URL' }, { status: 500 })
  }

  return NextResponse.json({ url: data.url })
}
