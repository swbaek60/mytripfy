import { createClient, getAuthUser } from '@/utils/supabase/server'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode, getCountryCodesMatchingQuery } from '@/data/countries'
import { headers } from 'next/headers'
import BookmarkButton from '@/components/BookmarkButton'
import CountryFlag from '@/components/CountryFlag'
import CompanionsCountryFilter from '@/app/[locale]/companions/CompanionsCountryFilter'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SeoPages' })
  return buildPageMetadata({
    locale,
    path: '/companions',
    title: t('companionsTitle'),
    description: t('companionsDesc'),
    keywords: [
      'travel companion',
      'trip buddy',
      'travel partner',
      'group travel',
      'mytripfy',
    ],
  })
}

const PURPOSE_LABELS: Record<string, string> = {
  tourism: 'Tourism',
  backpacking: 'Backpacking',
  business: 'Business',
  food: 'Food Tour',
  adventure: 'Adventure',
  culture: 'Culture',
  photography: 'Photography',
  volunteer: 'Volunteer',
  other: 'Other',
}

const GENDER_LABELS: Record<string, string> = {
  any: 'Anyone',
  male_only: 'Male only',
  female_only: 'Female only',
}

export default async function CompanionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ country?: string; purpose?: string; q?: string }>
}) {
  const { locale } = await params
  const { country, purpose, q: searchQuery } = await searchParams
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  const t = await getTranslations({ locale, namespace: 'Companions' })
  const td = await getTranslations({ locale, namespace: 'CompanionDetail' })

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // 동행 게시글 조회 (프로필 join)
  // end_date: 오늘 이후 종료되는 여행만 표시
  const today = new Date().toISOString().split('T')[0]

  // 나라별 필터용: open 게시글의 destination_country 전체 목록 (글 많은 순, 클라이언트에서 상위 20개 먼저 표시 후 전체보기 가능)
  const { data: countryRows } = await supabase
    .from('companion_posts')
    .select('destination_country')
    .eq('status', 'open')
    .gte('end_date', today)
    .not('destination_country', 'is', null)
  const countByCountry = new Map<string, number>()
  for (const row of countryRows ?? []) {
    const code = (row as { destination_country: string }).destination_country
    if (code?.trim()) countByCountry.set(code, (countByCountry.get(code) ?? 0) + 1)
  }
  const countryFilterList = [...countByCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ code, count: countByCountry.get(code)! }))

  let query = supabase
    .from('companion_posts')
    .select(`
      *,
      profiles (
        id, full_name, avatar_url, travel_level, trust_score, nationality
      )
    `)
    .eq('status', 'open')
    .gte('end_date', today)
    .order('created_at', { ascending: false })

  if (country) {
    query = query.eq('destination_country', country)
  } else if (searchQuery?.trim()) {
    const q = searchQuery.trim()
    const escaped = q.replace(/[%_\\]/g, '\\$&').replace(/"/g, '""')
    const matchingCodes = getCountryCodesMatchingQuery(q)
    if (matchingCodes.length > 0) {
      const cityPattern = `%${escaped}%`
      query = query.or(
        `destination_country.in.("${matchingCodes.join('","')}"),destination_city.ilike."${cityPattern.replace(/"/g, '""')}"`
      )
    } else {
      query = query.ilike('destination_city', `%${escaped}%`)
    }
  }
  if (purpose) query = query.eq('purpose', purpose)

  const { data: posts } = await query

  // 신청 수: companion_post_application_counts 뷰 사용 (schema-v35)
  // 뷰 미적용 시 0으로 표시
  let appCountMap: Record<string, number> = {}
  if (posts && posts.length > 0) {
    const postIds = posts.map(p => p.id)
    const { data: counts } = await supabase
      .from('companion_post_application_counts')
      .select('post_id, count')
      .in('post_id', postIds)
    counts?.forEach((r: { post_id: string; count: number }) => {
      appCountMap[r.post_id] = r.count
    })
  }

  // 내 북마크 목록 가져오기
  const { data: myBookmarks } = user ? await supabase
    .from('bookmarks')
    .select('reference_id')
    .eq('user_id', user.id)
    .eq('type', 'companion_post') : { data: [] }

  const bookmarkedIds = new Set(myBookmarks?.map(b => b.reference_id) || [])

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/companions" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-heading">{t('title')}</h1>
            <p className="text-subtle mt-1 text-sm">{t('subtitle')}</p>
          </div>
          {user ? (
            <Link href={`/${locale}/companions/new`}>
              <Button className="bg-brand hover:bg-brand-hover rounded-full px-6 shrink-0">
                + {t('post')}
              </Button>
            </Link>
          ) : (
            <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/companions`)}`}>
              <Button className="bg-brand hover:bg-brand-hover rounded-full px-6 shrink-0">
                + {t('post')}
              </Button>
            </Link>
          )}
        </div>

        {/* Filter Bar: Country (상위 20개 + 전체보기) */}
        <CompanionsCountryFilter
          list={countryFilterList}
          currentCountry={country}
          locale={locale}
          purpose={purpose}
          searchQuery={searchQuery}
          labelFilter={t('filterByCountry')}
          labelAll={t('allCountries')}
          labelViewAll={t('viewAllCountries')}
        />

        {/* Filter Bar: Purpose */}
        <div className="bg-surface rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-subtle font-medium mr-1 shrink-0">{t('filterByPurpose')}</span>
          <Link href={`/${locale}/companions${country || searchQuery ? `?${new URLSearchParams([...(country ? [['country', country]] : []), ...(searchQuery ? [['q', searchQuery]] : [])]).toString()}` : ''}`}>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${!purpose ? 'bg-brand text-white' : 'bg-surface-sunken text-body hover:bg-brand-light'}`}>
              All
            </span>
          </Link>
          {Object.entries(PURPOSE_LABELS).map(([key, label]) => {
            const href = `/${locale}/companions?purpose=${key}${country ? `&country=${country}` : ''}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`
            return (
              <Link key={key} href={href}>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${purpose === key ? 'bg-brand text-white' : 'bg-surface-sunken text-body hover:bg-brand-light'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Posts Grid */}
        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => {
              const countryInfo = getCountryByCode(post.destination_country)
              const profile = post.profiles as Record<string, unknown>
              const appCount = appCountMap[post.id] ?? 0
              const startDate = new Date(post.start_date)
              const endDate = new Date(post.end_date)
              const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              const avatarUrl = profile?.avatar_url as string | undefined
              const fullName = (profile?.full_name as string) || 'Anonymous'
              const initials = fullName.charAt(0).toUpperCase()

              return (
                <Link key={post.id} href={`/${locale}/companions/${post.id}`}>
                  <div className="bg-surface rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer border border-edge/50 hover:border-brand/40 h-full flex flex-col overflow-hidden group">

                    {/* Split Header: Left = Profile, Right = Trip photo or Flag */}
                    <div className="flex h-44 overflow-hidden">
                      {/* Left — Poster profile */}
                      <div className="w-1/2 relative bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-r border-white/30">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={fullName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/40 flex flex-col items-center justify-center gap-1">
                            <div className="w-14 h-14 rounded-full bg-brand/30 border-2 border-brand/40 flex items-center justify-center">
                              <span className="text-2xl font-bold text-brand">{initials}</span>
                            </div>
                          </div>
                        )}
                        {/* Name overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                          <p className="text-white text-xs font-medium truncate">{fullName}</p>
                        </div>
                      </div>

                      {/* Right — Trip cover or country flag */}
                      <div className="w-1/2 relative overflow-hidden">
                        {post.cover_image ? (
                          <>
                            <img
                              src={post.cover_image}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand/80 to-indigo/90 flex flex-col items-center justify-center gap-2">
                            <div className="transform group-hover:scale-110 transition-transform duration-300">
                              <img
                                src={`https://flagcdn.com/80x60/${post.destination_country.toLowerCase()}.png`}
                                srcSet={`https://flagcdn.com/160x120/${post.destination_country.toLowerCase()}.png 2x`}
                                width={80}
                                height={60}
                                alt={post.destination_country}
                                className="rounded-md shadow-lg object-cover"
                              />
                            </div>
                            <span className="text-white/90 text-xs font-semibold tracking-wide">
                              {countryInfo?.name || post.destination_country}
                            </span>
                          </div>
                        )}
                        {/* Duration badge */}
                        <div className="absolute top-2 right-2">
                          <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {nights}N {nights + 1}D
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col flex-1">

                      {/* Destination */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CountryFlag code={post.destination_country} size="sm" className="shrink-0" />
                          <span className="font-bold text-heading text-sm truncate">
                            {countryInfo?.name || post.destination_country}
                          </span>
                          {post.destination_city && (
                            <span className="text-subtle text-xs truncate">· {post.destination_city.split(', ')[0]}</span>
                          )}
                        </div>
                        {user && (
                          <BookmarkButton
                            userId={user.id}
                            type="companion_post"
                            referenceId={post.id}
                            isBookmarked={bookmarkedIds.has(post.id)}
                            size="sm"
                          />
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-heading text-sm mb-3 line-clamp-2 leading-snug">{post.title}</h3>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.purpose && (
                          <span className="text-[11px] bg-brand-light text-brand-hover px-2 py-0.5 rounded-full font-medium">
                            {PURPOSE_LABELS[post.purpose] || post.purpose}
                          </span>
                        )}
                        <span className="text-[11px] bg-purple-light text-purple px-2 py-0.5 rounded-full font-medium">
                          {GENDER_LABELS[post.gender_preference] || 'Anyone'}
                        </span>
                        <span className="text-[11px] bg-success-light text-success px-2 py-0.5 rounded-full font-medium">
                          👥 {post.max_people}
                        </span>
                      </div>

                      {/* Dates */}
                      <div suppressHydrationWarning className="text-xs text-subtle mb-3 flex items-center gap-1">
                        <span>📅</span>
                        <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-edge/50">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-brand-muted overflow-hidden flex items-center justify-center shrink-0">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] font-bold text-brand">{initials}</span>
                            )}
                          </div>
                          <span className="text-xs text-body font-medium truncate max-w-[100px]">{fullName}</span>
                        </div>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${appCount > 0 ? 'bg-brand-light text-brand' : 'text-hint'}`}>
                          {appCount > 0 ? `${appCount} applied` : 'Be the first!'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-body mb-2">{td('noTripsYet')}</h3>
            <p className="text-subtle mb-6">{td('noTripsHint')}</p>
            <Link href={`/${locale}/companions/new`}>
              <Button className="bg-brand hover:bg-brand-hover rounded-full px-8">
                Post My Trip
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
