'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
}

/** 프로필의 preferred_locale 조회, 없으면 fallback 사용 */
async function getPreferredLocale(supabase: SupabaseClient, userId: string | undefined, fallback: string): Promise<string> {
  if (!userId) return fallback
  const { data } = await supabase.from('profiles').select('preferred_locale').eq('id', userId).single()
  const preferred = data?.preferred_locale
  if (preferred && typeof preferred === 'string') return preferred
  return fallback
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const locale = (formData.get('locale') as string) || 'en'

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) redirect(`/${locale}/login?message=Could not authenticate user`)

  const redirectLocale = await getPreferredLocale(supabase, data.user?.id, locale)
  revalidatePath('/', 'layout')
  redirect(`/${redirectLocale}`)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const locale = (formData.get('locale') as string) || 'en'

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${getOrigin()}/auth/callback?locale=${locale}`,
    },
  })

  if (error) redirect(`/${locale}/login?message=Could not authenticate user`)

  // Confirm email이 꺼져 있으면 세션이 바로 내려옴 → 가입 직후 로그인
  if (data.session) {
    const redirectLocale = await getPreferredLocale(supabase, data.user?.id, locale)
    revalidatePath('/', 'layout')
    redirect(`/${redirectLocale}`)
  }

  // Confirm email이 켜져 있으면 세션 없음. 매직 링크로 바로 로그인 시킨 뒤, 확인 메일은 Supabase가 그대로 발송함.
  const email = formData.get('email') as string
  try {
    const admin = createAdminClient()
    const redirectTo = `${getOrigin()}/auth/callback?locale=${locale}`
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })
    if (!linkError && linkData?.properties?.action_link) {
      redirect(linkData.properties.action_link)
    }
  } catch {
    // Admin 실패 시 기존처럼 메일 확인 안내
  }
  redirect(`/${locale}/login?message=Check email to continue sign in process`)
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const locale = (formData.get('locale') as string) || 'en'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getOrigin()}/auth/callback?locale=${locale}`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error || !data.url) redirect(`/${locale}/login?message=Could not authenticate user`)
  redirect(data.url)
}

export async function signInWithApple(formData: FormData) {
  const supabase = await createClient()
  const locale = (formData.get('locale') as string) || 'en'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${getOrigin()}/auth/callback?locale=${locale}`,
    },
  })

  if (error || !data.url) redirect(`/${locale}/login?message=Could not authenticate user`)
  redirect(data.url)
}

export async function signInWithFacebook(formData: FormData) {
  const supabase = await createClient()
  const locale = (formData.get('locale') as string) || 'en'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${getOrigin()}/auth/callback?locale=${locale}`,
    },
  })

  if (error || !data.url) redirect(`/${locale}/login?message=Could not authenticate user`)
  redirect(data.url)
}
