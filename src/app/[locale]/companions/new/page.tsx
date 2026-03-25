import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import CompanionForm from './CompanionForm'

export default async function NewCompanionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in`)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/companions" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <CompanionForm userId={user.id} locale={locale} />
      </main>
    </div>
  )
}
