import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import TripForm from '../TripForm'

export default async function NewTripPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/trips" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <TripForm userId={user.id} locale={locale} />
      </main>
    </div>
  )
}

