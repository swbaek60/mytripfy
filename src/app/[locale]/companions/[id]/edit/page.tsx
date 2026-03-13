import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import CompanionForm from '../../new/CompanionForm'

export default async function EditCompanionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: post } = await supabase
    .from('companion_posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/companions" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <CompanionForm userId={user.id} locale={locale} initialData={post} />
      </main>
    </div>
  )
}
