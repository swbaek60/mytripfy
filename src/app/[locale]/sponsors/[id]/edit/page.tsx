import { createClient, getAuthUser } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/Header'
import SponsorEditForm from './SponsorEditForm'

import type { Metadata } from 'next'
import { buildPrivateMetadata } from '@/lib/seo/private-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  return buildPrivateMetadata({ locale, path: `/sponsors/${id}/edit`, namespace: 'Sponsors', titleKey: 'editSponsor' })
}
export default async function EditSponsorPage({
  params,
}: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/sponsors/${id}/edit`)}`)

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('*')
    .eq('id', id)
    .single()

  if (!sponsor || sponsor.user_id !== user.id) notFound()

  const { data: benefits } = await supabase
    .from('sponsor_benefits')
    .select('*')
    .eq('sponsor_id', id)
    .order('created_at', { ascending: false })

  const t = await getTranslations({ locale, namespace: 'Sponsors' })

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-heading mb-6">{t('editHeading', { name: sponsor.name })}</h1>
        <SponsorEditForm sponsor={sponsor} benefits={benefits ?? []} locale={locale} />
      </main>
    </div>
  )
}
