import { createClient } from '@/utils/supabase/server'
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">🧠 {t('title')}</h1>
          <p className="text-gray-500">{t('subtitle')}</p>
        </div>
        <PersonalityTest userId={user.id} locale={locale} />
      </main>
    </div>
  )
}
