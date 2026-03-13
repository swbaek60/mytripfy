'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

export async function logout(formData: FormData) {
  const supabase = await createClient()
  const locale = (formData.get('locale') as string) || 'en'
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(`/${locale}`)
}

/** 로그인한 사용자의 선호 언어 저장. LanguageSelector에서 언어 변경 시 호출 */
export async function updatePreferredLocale(locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const validLocales = routing.locales as readonly string[]
  if (!validLocales.includes(locale)) return
  await supabase
    .from('profiles')
    .update({ preferred_locale: locale, updated_at: new Date().toISOString() })
    .eq('id', user.id)
}
