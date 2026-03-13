import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Header from '@/components/Header'
import TripForm from '../../TripForm'

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!trip) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/trips" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <TripForm
          userId={user.id}
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

