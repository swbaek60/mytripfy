'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { routing } from '@/i18n/routing'

/** 로그인한 사용자의 선호 언어 저장 */
export async function updatePreferredLocale(locale: string) {
  const { userId } = await auth()
  if (!userId) return
  const validLocales = routing.locales as readonly string[]
  if (!validLocales.includes(locale)) return

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ preferred_locale: locale, updated_at: new Date().toISOString() })
    .eq('clerk_id', userId)
  if (error) {
    console.error('[updatePreferredLocale]', error.message)
  }
  revalidatePath('/', 'layout')
}
