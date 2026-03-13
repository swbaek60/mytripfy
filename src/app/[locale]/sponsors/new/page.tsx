import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import SponsorForm from './SponsorForm'
import { getTranslations } from 'next-intl/server'

export default async function NewSponsorPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const t = await getTranslations({ locale, namespace: 'Sponsors' })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/sponsors" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">+ {t('addSponsor')}</h1>
        <p className="text-gray-500 text-sm mb-6">{t('subtitle')}</p>
        <SponsorForm userId={user.id} locale={locale} />
      </main>
    </div>
  )
}
