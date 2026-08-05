import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import CompanionForm from '../../new/CompanionForm'

import type { Metadata } from 'next'
import { buildPrivateMetadata } from '@/lib/seo/private-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  return buildPrivateMetadata({ locale, path: `/companions/${id}/edit`, namespace: 'CompanionDetail', titleKey: 'editTripTitle' })
}

export default async function EditCompanionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  const { data: post } = await supabase
    .from('companion_posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CompanionForm locale={locale} initialData={post} />
      </main>
    </div>
  )
}
