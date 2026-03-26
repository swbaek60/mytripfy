import { createClient, getAuthUser } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/Header'
import SponsorEditForm from './SponsorEditForm'
export default async function EditSponsorPage({
  params,
}: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

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

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/sponsors" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-heading mb-6">Edit: {sponsor.name}</h1>
        <SponsorEditForm sponsor={sponsor} benefits={benefits ?? []} locale={locale} />
      </main>
    </div>
  )
}
