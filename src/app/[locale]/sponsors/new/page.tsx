import { getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import SponsorForm from './SponsorForm'
import { getTranslations } from 'next-intl/server'

import type { Metadata } from 'next'
import { buildPrivateMetadata } from '@/lib/seo/private-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPrivateMetadata({ locale, path: '/sponsors/new', namespace: 'Sponsors', titleKey: 'addSponsor' })
}

export default async function NewSponsorPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!(await getAuthUser())) {
    redirect(`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/sponsors/new`)}`)
  }

  const t = await getTranslations({ locale, namespace: 'Sponsors' })

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-heading mb-2">+ {t('addSponsor')}</h1>
        <p className="text-subtle text-sm mb-6">{t('subtitle')}</p>
        <SponsorForm locale={locale} />
      </main>
    </div>
  )
}
