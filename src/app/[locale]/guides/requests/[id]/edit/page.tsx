import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import GuideRequestEditForm from './GuideRequestEditForm'

import type { Metadata } from 'next'
import { buildPrivateMetadata } from '@/lib/seo/private-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  return buildPrivateMetadata({ locale, path: `/guides/requests/${id}/edit`, namespace: 'GuideRequests', titleKey: 'editTitle' })
}

export default async function EditGuideRequestPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  const { data: request } = await supabase
    .from('guide_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!request) notFound()
  if (request.user_id !== user.id) redirect(`/${locale}/guides/requests/${id}`)

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <GuideRequestEditForm locale={locale} request={request} />
      </main>
    </div>
  )
}
