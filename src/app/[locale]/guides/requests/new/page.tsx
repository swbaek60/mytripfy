import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import GuideRequestForm from './GuideRequestForm'

export default async function NewGuideRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in`)

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/guides" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <GuideRequestForm userId={user.id} locale={locale} />
      </main>
    </div>
  )
}
