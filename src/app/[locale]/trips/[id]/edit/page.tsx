import { redirect, notFound } from 'next/navigation'
import { createClient, getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import TripForm from '../../TripForm'

import type { Metadata } from 'next'
import { buildPrivateMetadata } from '@/lib/seo/private-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  return buildPrivateMetadata({ locale, path: `/trips/${id}/edit`, namespace: 'SeoPages', titleKey: 'tripEditTitle' })
}

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!trip) notFound()

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <TripForm
          locale={locale}
          initialTrip={{
            id: trip.id,
            title: trip.title,
            destination_country: trip.destination_country,
            start_date: trip.start_date,
            end_date: trip.end_date,
            visibility: trip.visibility,
            description: trip.description,
          }}
        />
      </main>
    </div>
  )
}

