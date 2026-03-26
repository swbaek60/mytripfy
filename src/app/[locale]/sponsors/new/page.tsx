import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import SponsorForm from './SponsorForm'
import { getTranslations } from 'next-intl/server'

export default async function NewSponsorPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  const t = await getTranslations({ locale, namespace: 'Sponsors' })

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/sponsors" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-heading mb-2">+ {t('addSponsor')}</h1>
        <p className="text-subtle text-sm mb-6">{t('subtitle')}</p>
        <SponsorForm userId={user.id} locale={locale} />
      </main>
    </div>
  )
}
