import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { FileText, Send, Globe, Trophy, Star } from 'lucide-react'
import MyPostsSection from '@/components/dashboard/MyPostsSection'
import DashboardCompletenessBanner from '@/components/dashboard/DashboardCompletenessBanner'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Dashboard' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [
    { data: myPosts },
    { data: myApplications },
    { data: myGuideRequests },
    { data: myGuideApplications },
    { data: bookmarks },
    { data: profile },
    { data: myTrips },
  ] = await Promise.all([
    supabase
      .from('companion_posts')
      .select('*, companion_applications(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('companion_applications')
      .select('*, companion_posts(title, destination_country, start_date, end_date, status)')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('guide_requests')
      .select('*, guide_applications(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('guide_applications')
      .select('*, guide_requests(id, title, destination_country, start_date, end_date, status)')
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('profiles')
      .select('travel_level, travel_count, trust_score, review_count, is_guide, challenge_points')
      .eq('id', user.id)
      .single(),
    supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true }),
  ])

  const APP_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/dashboard" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
          </div>
          <Link href={`/${locale}/companions/new`} className="shrink-0">
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-full w-full sm:w-auto">+ {t('postTrip')}</Button>
          </Link>
        </div>

        {/* 프로필 완성도 배너 (100% 미만일 때만) */}
        <DashboardCompletenessBanner locale={locale} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: t('myPosts'), value: myPosts?.length || 0, Icon: FileText, color: 'text-blue-600', link: false },
            { label: t('applications'), value: myApplications?.length || 0, Icon: Send, color: 'text-indigo-600', link: false },
            { label: t('countries'), value: profile?.travel_count || 0, Icon: Globe, color: 'text-green-600', link: false },
            { label: t('challengePts'), value: profile?.challenge_points || 0, Icon: Trophy, color: 'text-purple-600', link: true },
            { label: t('avgRating'), value: profile?.trust_score ? Number(profile.trust_score).toFixed(1) : '—', Icon: Star, color: 'text-yellow-500', link: false },
          ].map(stat => {
            const content = (
              <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                <stat.Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                {stat.link && (
                  <div className="text-[10px] text-purple-500 mt-1 font-medium">{t('seeRanking')}</div>
                )}
              </div>
            )
            return stat.link ? (
              <Link key={stat.label} href={`/${locale}/hall-of-fame`} className="block hover:shadow-md transition-shadow rounded-2xl">
                {content}
              </Link>
            ) : (
              <div key={stat.label}>{content}</div>
            )
          })}
        </div>

        {/* 내가 등록한 글 (동행·가이드) - 상태 필터 */}
        <MyPostsSection
          myPosts={myPosts || []}
          myGuideRequests={myGuideRequests || []}
          locale={locale}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Applications I sent (Companion) */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">{t('companionAppsSent')} ({myApplications?.length || 0})</h2>
            {myApplications && myApplications.length > 0 ? (
              <div className="space-y-3">
                {myApplications.map(app => {
                  const post = app.companion_posts as Record<string, unknown>
                  const country = post ? getCountryByCode(post.destination_country as string) : null
                  return (
                    <Link key={app.id} href={`/${locale}/companions/${(post as Record<string,unknown> | null) ? app.post_id : '#'}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer">
                        <span className="text-xl shrink-0">{country?.emoji || '🌍'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate text-sm">{(post?.title as string) || 'Trip'}</p>
                          <p suppressHydrationWarning className="text-xs text-gray-500">{post?.start_date ? new Date(post.start_date as string).toLocaleDateString('en-US') : ''}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${APP_STATUS_COLORS[app.status]}`}>
                          {app.status}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">{t('noAppsSent')}</p>
                <Link href={`/${locale}/companions`}>
                  <Button variant="link" className="text-blue-600 text-sm mt-1">{t('browseTrips')}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* My Guide Applications (as guide) */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">{t('myGuideApps')} ({myGuideApplications?.length || 0})</h2>
            {myGuideApplications && myGuideApplications.length > 0 ? (
              <div className="space-y-3">
                {myGuideApplications.map((app: { id: string; request_id: string; status: string; guide_requests: { title: string; destination_country: string; start_date: string } | null }) => {
                  const req = app.guide_requests
                  const country = req ? getCountryByCode(req.destination_country) : null
                  return (
                    <Link key={app.id} href={`/${locale}/guides/requests/${app.request_id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer">
                        <span className="text-xl shrink-0">{country?.emoji || '🌍'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate text-sm">{req?.title || 'Guide request'}</p>
                          <p suppressHydrationWarning className="text-xs text-gray-500">{req?.start_date ? new Date(req.start_date).toLocaleDateString(locale.startsWith('ko') ? 'ko-KR' : 'en-US') : ''}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${APP_STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600'}`}>
                          {app.status}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No guide applications yet.</p>
                <Link href={`/${locale}/guides/requests`}>
                  <Button variant="link" className="text-amber-600 text-sm mt-1">Browse guide requests →</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* My Trip Plans (Itineraries) */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">My Trip Plans ({myTrips?.length || 0})</h2>
            <Link href={`/${locale}/trips/new`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-blue-300 text-blue-600">
                + New Plan
              </Button>
            </Link>
          </div>
          {myTrips && myTrips.length > 0 ? (
            <div className="space-y-3">
              {myTrips.slice(0, 5).map(trip => {
                const country = trip.destination_country ? getCountryByCode(trip.destination_country) : null
                const start = new Date(trip.start_date)
                const end = new Date(trip.end_date)
                const dateFmt = locale.startsWith('ko') ? 'ko-KR' : 'en-US'
                const dateLabel =
                  !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
                    ? `${start.toLocaleDateString(dateFmt)} – ${end.toLocaleDateString(dateFmt)}`
                    : ''
                return (
                    <Link key={trip.id} href={`/${locale}/trips/${trip.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer">
                      <span className="text-xl shrink-0">{country?.emoji || '🌍'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate text-sm">{trip.title}</p>
                        {dateLabel && (
                          <p className="text-xs text-gray-500">{dateLabel}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          trip.visibility === 'public'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {trip.visibility === 'public' ? t('public') : t('private')}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No trip plans yet.</p>
              <Link href={`/${locale}/trips/new`}>
                <Button variant="link" className="text-blue-600 text-sm mt-1">Create your first plan →</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('editProfile'), href: `/${locale}/profile/edit` },
            { label: t('personalityTest'), href: `/${locale}/personality` },
            { label: t('findGuides'), href: `/${locale}/guides` },
            { label: t('guideRequests'), href: `/${locale}/guides/requests` },
            { label: t('myBookmarks'), href: `/${locale}/bookmarks` },
          ].map(link => (
            <Link key={link.label} href={link.href}>
              <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-center cursor-pointer border border-transparent hover:border-blue-100">
                <div className="text-sm font-medium text-gray-700">{link.label}</div>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  )
}
