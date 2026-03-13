import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { getCountryByCode, getLevelInfo } from '@/data/countries'
import { Button } from '@/components/ui/button'
import BookmarkButton from '@/components/BookmarkButton'
import { Bookmark } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function BookmarksPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Bookmarks' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // 동행 북마크
  const { data: postBookmarks } = await supabase
    .from('bookmarks')
    .select('reference_id, created_at')
    .eq('user_id', user.id)
    .eq('type', 'companion_post')
    .order('created_at', { ascending: false })

  // 가이드 북마크
  const { data: guideBookmarks } = await supabase
    .from('bookmarks')
    .select('reference_id, created_at')
    .eq('user_id', user.id)
    .eq('type', 'guide')
    .order('created_at', { ascending: false })

  // 북마크된 게시글 상세 조회
  const postIds = postBookmarks?.map(b => b.reference_id) || []
  const guideIds = guideBookmarks?.map(b => b.reference_id) || []

  const [{ data: posts }, { data: guides }] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from('companion_posts')
          .select('*, profiles(id, full_name, avatar_url, travel_level)')
          .in('id', postIds)
      : { data: [] },
    guideIds.length > 0
      ? supabase
          .from('profiles')
          .select('*')
          .in('id', guideIds)
      : { data: [] },
  ])

  const totalCount = (posts?.length || 0) + (guides?.length || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-blue-500 fill-blue-500" />
              {t('title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{t('savedCount', { count: totalCount })}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/companions`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-blue-200 text-blue-600 hover:bg-blue-50">
                {t('findTrips')}
              </Button>
            </Link>
            <Link href={`/${locale}/guides`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-yellow-300 text-yellow-600 hover:bg-yellow-50">
                {t('findGuides')}
              </Button>
            </Link>
          </div>
        </div>

        {totalCount === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm">
            <Bookmark className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No bookmarks yet.</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Save trips and guides by tapping the bookmark icon.</p>
            <div className="flex gap-3 justify-center">
              <Link href={`/${locale}/companions`}>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-6">✈️ Browse Trips</Button>
              </Link>
              <Link href={`/${locale}/guides`}>
                <Button className="bg-yellow-500 hover:bg-yellow-600 rounded-full px-6">🧭 Browse Guides</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">

            {/* 동행 게시글 북마크 */}
            {posts && posts.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
                  {t('savedTrips', { count: posts.length })}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {posts.map(post => {
                    const dest = getCountryByCode(post.destination_country)
                    const poster = post.profiles as Record<string, unknown>
                    const start = new Date(post.start_date)
                    const end = new Date(post.end_date)
                    const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-3 hover:shadow-md transition-shadow">
                        <Link href={`/${locale}/companions/${post.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{dest?.emoji || '🌍'}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">{dest?.name || post.destination_country}</div>
                              <div suppressHydrationWarning className="text-xs text-gray-400">{nights}N {nights + 1}D · {start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{post.title}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs overflow-hidden">
                              {(poster?.avatar_url as string) ? (
                                <img src={poster.avatar_url as string} alt="" className="w-full h-full object-cover" />
                              ) : '👤'}
                            </div>
                            <span className="text-xs text-gray-400 truncate">{(poster?.full_name as string) || t('anonymous')}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${post.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                              {post.status === 'open' ? t('open') : t('closed')}
                            </span>
                          </div>
                        </Link>
                        <div className="shrink-0">
                          <BookmarkButton
                            userId={user.id}
                            type="companion_post"
                            referenceId={post.id}
                            isBookmarked={true}
                            size="sm"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 가이드 북마크 */}
            {guides && guides.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-yellow-400 rounded-full inline-block" />
                  {t('savedGuides', { count: guides.length })}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guides.map(guide => {
                    const levelInfo = getLevelInfo(guide.travel_level || 1)
                    const natCountry = guide.nationality ? getCountryByCode(guide.nationality) : null
                    const isFree = !guide.guide_hourly_rate || guide.guide_hourly_rate === 0
                    return (
                      <div key={guide.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                        <Link href={`/${locale}/guides/${guide.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                            {guide.avatar_url ? (
                              <img src={guide.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : '👤'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm truncate">{guide.full_name || 'Anonymous Guide'}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {natCountry && <span className="text-xs text-gray-400">{natCountry.emoji} {natCountry.name}</span>}
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: levelInfo.color }}>
                                {levelInfo.badge} Lv.{levelInfo.level}
                              </span>
                              {isFree && <span className="text-xs bg-green-50 text-green-600 font-semibold px-1.5 py-0.5 rounded-full">{t('free')}</span>}
                            </div>
                            {guide.trust_score > 0 && (
                              <div className="text-xs text-yellow-500 mt-0.5">
                                {'★'.repeat(Math.round(guide.trust_score))} {Number(guide.trust_score).toFixed(1)} ({guide.review_count})
                              </div>
                            )}
                          </div>
                        </Link>
                        <BookmarkButton
                          userId={user.id}
                          type="guide"
                          referenceId={guide.id}
                          isBookmarked={true}
                          size="sm"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
