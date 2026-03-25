import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import ReviewForm from './ReviewForm'
import { PenLine } from 'lucide-react'

export default async function WriteReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ userId?: string }>
}) {
  const { locale } = await params
  const { userId } = await searchParams

  if (!userId) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in`)
  if (user.id === userId) redirect(`/${locale}/profile`)

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .single()

  if (!targetProfile) notFound()

  // 기존 리뷰 조회 (수정 지원)
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id, rating, content')
    .eq('reviewer_id', user.id)
    .eq('reviewee_id', userId)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-heading mb-6 flex items-center gap-2">
          <PenLine className="w-6 h-6 text-purple" />
          {existingReview ? 'Edit My Review' : 'Write a Review'}
        </h1>
        <ReviewForm
          user={user}
          targetProfile={targetProfile}
          locale={locale}
          existingReview={existingReview ?? null}
        />
      </main>
    </div>
  )
}
