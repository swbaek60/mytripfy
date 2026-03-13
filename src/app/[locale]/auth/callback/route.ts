import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const fallbackLocale = searchParams.get('locale') || locale || 'en'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_locale')
        .eq('id', data.user.id)
        .single()
      const redirectLocale = (profile?.preferred_locale as string) || fallbackLocale
      return NextResponse.redirect(`${origin}/${redirectLocale}`)
    }
  }

  return NextResponse.redirect(`${origin}/${fallbackLocale}/login?message=Could not authenticate user`)
}
