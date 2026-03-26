import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { MessageSquare, Star, ChevronRight } from 'lucide-react'
import { getLevelInfo } from '@/data/countries'

export default async function MyReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  const { data: myReviews } = await supabase
    .from('reviews')
    .select('id, rating, content, tags, created_at, reviewee_id')
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false })

  const list = myReviews ?? []
  const revieweeIds = [...new Set(list.map((r) => r.reviewee_id))]
  const { data: profiles } = revieweeIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, travel_level')
        .in('id', revieweeIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const isKo = locale.startsWith('ko')
  const title = isKo ? '내가 리뷰한 사람들' : 'People I Reviewed'
  const emptyMsg = isKo ? '아직 리뷰를 쓴 사람이 없습니다.' : "You haven't reviewed anyone yet."
  const viewProfile = isKo ? '프로필 보기' : 'View profile'

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-heading mb-2 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-purple" />
          {title}
        </h1>
        <p className="text-sm text-subtle mb-6">
          {list.length} {isKo ? '명' : 'people'}
        </p>

        {list.length === 0 ? (
          <div className="bg-surface rounded-2xl shadow-sm p-8 text-center text-subtle">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{emptyMsg}</p>
            <Link
              href={`/${locale}/companions`}
              className="inline-block mt-4 text-sm font-semibold text-purple hover:text-purple"
            >
              {isKo ? '동행 찾기 →' : 'Find companions →'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((review) => {
              const reviewee = profileMap.get(review.reviewee_id)
              const levelInfo = getLevelInfo(reviewee?.travel_level ?? 1)
              return (
                <Link
                  key={review.id}
                  href={`/${locale}/users/${review.reviewee_id}#reviews`}
                  className="block bg-surface rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-light flex items-center justify-center overflow-hidden shrink-0">
                      {reviewee?.avatar_url ? (
                        <img src={reviewee.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-heading">
                          {reviewee?.full_name || (isKo ? '알 수 없음' : 'Unknown')}
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: levelInfo.color }}
                        >
                          {levelInfo.badge} Lv.{levelInfo.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-yellow-500 text-sm">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{review.rating}/5</span>
                      </div>
                      {review.content && (
                        <p className="text-sm text-body mt-2 line-clamp-2">{review.content}</p>
                      )}
                      <p className="text-xs text-hint mt-2">
                        {new Date(review.created_at).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-hint shrink-0 mt-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-6">
          <Link
            href={`/${locale}/profile`}
            className="text-sm font-semibold text-purple hover:text-purple"
          >
            ← {isKo ? '내 프로필' : 'My profile'}
          </Link>
        </div>
      </main>
    </div>
  )
}
