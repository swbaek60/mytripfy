import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import PersonalityTest from './PersonalityTest'
import { getTranslations } from 'next-intl/server'

export default async function PersonalityPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Personality' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-heading mb-2">🧠 {t('title')}</h1>
          <p className="text-subtle">{t('subtitle')}</p>
        </div>
        <PersonalityTest userId={user.id} locale={locale} />
      </main>
    </div>
  )
}
