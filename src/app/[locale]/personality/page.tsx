import { getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import PersonalityTest from './PersonalityTest'
import { getTranslations } from 'next-intl/server'

export default async function PersonalityPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Personality' })
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  return (
    <div className="min-h-screen bg-surface-warm">
      <Header user={user} locale={locale} currentPath="/personality" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand text-xs font-bold mb-3">
            ✨ {tm('navTripMatcher')}
          </p>
          <h1 className="text-3xl font-extrabold text-heading mb-2">{t('title')}</h1>
          <p className="text-subtle max-w-lg mx-auto">{t('subtitle')}</p>
        </div>
        <PersonalityTest userId={user?.id ?? null} locale={locale} />
      </main>
    </div>
  )
}
