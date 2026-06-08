import { createClient, getAuthUser } from '@/utils/supabase/server'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode, getCountryCodesMatchingQuery } from '@/data/countries'
import { resolveAliasToEnglish } from '@/data/city-aliases'
import { headers } from 'next/headers'
import CompanionsCountryFilter from '@/app/[locale]/companions/CompanionsCountryFilter'
import CompanionsDateFilter from '@/app/[locale]/companions/CompanionsDateFilter'
import HeroSearch from '@/components/marketing/HeroSearch'
import CompanionStoryCard from '@/components/explore/CompanionStoryCard'
import RecentCompanionsBar from '@/components/explore/RecentCompanionsBar'
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

const PURPOSE_KEYS = [
  'tourism', 'backpacking', 'business', 'food', 'adventure', 'culture', 'photography', 'volunteer', 'other',
] as const

const MOOD_PURPOSES: Record<string, string[]> = {
  relaxed: ['tourism', 'culture', 'food'],
  active: ['backpacking', 'photography', 'adventure'],
  intense: ['adventure', 'volunteer'],
}

const VIBE_MOOD: Record<string, string> = {
  adventurer: 'intense',
  culture_seeker: 'relaxed',
  social_nomad: 'active',
  luxury_traveler: 'relaxed',
  backpacker: 'active',
  foodie_explorer: 'relaxed',
}

export default async function CompanionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ country?: string; purpose?: string; q?: string; vibe?: string; from?: string; mood?: string }>
}) {
  const { locale } = await params
  const { country, purpose, q: searchQuery, vibe, from, mood } = await searchParams
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  const t = await getTranslations({ locale, namespace: 'Companions' })
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
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
    // 도시 alias 변환 (한국어·일본어 등 → 영어 canonical)
    const resolvedQ = resolveAliasToEnglish(q)
    const escaped = resolvedQ.replace(/[%_\\]/g, '\\$&').replace(/"/g, '""')
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
  if (from) query = query.gte('start_date', from)

  const { data: postsRaw } = await query
  let posts = postsRaw

  const effectiveMood = mood || (vibe ? VIBE_MOOD[vibe] : undefined)
  if (effectiveMood && posts) {
    const allowed = MOOD_PURPOSES[effectiveMood] ?? []
    posts = posts.filter(p => !p.purpose || allowed.includes(p.purpose))
  }

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
    <div className="min-h-screen bg-surface-warm">
      <Header user={user} locale={locale} currentPath="/companions" />

      {/* Hero */}
      <section className="relative bg-midnight text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{tm('companionsHeroTitle')}</h1>
          <p className="text-white/70 mb-8 max-w-xl">{tm('companionsHeroSubtitle')}</p>
          <HeroSearch locale={locale} variant="inline" />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecentCompanionsBar locale={locale} title={tm('recentTitle')} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-subtle text-sm">
            {posts && posts.length > 0
              ? t('tripsCount', { count: posts.length })
              : t('allPurposes')}
          </p>
          {user ? (
            <Link href={`/${locale}/companions/new`}>
              <Button className="bg-brand hover:bg-brand-hover rounded-full px-6 shrink-0">+ {t('post')}</Button>
            </Link>
          ) : (
            <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/companions`)}`}>
              <Button className="bg-brand hover:bg-brand-hover rounded-full px-6 shrink-0">+ {t('post')}</Button>
            </Link>
          )}
        </div>

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

        {/* Date filter */}
        <CompanionsDateFilter
          locale={locale}
          currentFrom={from}
          currentCountry={country}
          currentPurpose={purpose}
          currentMood={effectiveMood}
          currentQuery={searchQuery}
          labelFrom={t('dateFilterFrom')}
          labelClear={t('dateFilterClear')}
        />

        {/* Mood filter */}
        <div className="bg-surface rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-subtle font-medium mr-1 shrink-0">{t('moodFilter')}</span>
          {(['relaxed', 'active', 'intense'] as const).map(m => {
            const params = new URLSearchParams()
            if (country) params.set('country', country)
            if (purpose) params.set('purpose', purpose)
            if (searchQuery) params.set('q', searchQuery)
            if (from) params.set('from', from)
            if (effectiveMood !== m) params.set('mood', m)
            const href = `/${locale}/companions${params.toString() ? `?${params}` : ''}`
            return (
              <Link key={m} href={href}>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${effectiveMood === m ? 'bg-brand text-white' : 'bg-surface-sunken text-body hover:bg-brand-light'}`}>
                  {t(`mood_${m}`)}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Purpose filter */}
        <div className="bg-surface rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-subtle font-medium mr-1 shrink-0">{t('filterByPurpose')}</span>
          <Link href={`/${locale}/companions${country || searchQuery ? `?${new URLSearchParams([...(country ? [['country', country]] : []), ...(searchQuery ? [['q', searchQuery]] : []), ...(from ? [['from', from]] : []), ...(effectiveMood ? [['mood', effectiveMood]] : [])]).toString()}` : ''}`}>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${!purpose ? 'bg-brand text-white' : 'bg-surface-sunken text-body hover:bg-brand-light'}`}>{t('allPurposes')}</span>
          </Link>
          {PURPOSE_KEYS.map(key => {
            const label = t(`purpose_${key}`)
            const p = new URLSearchParams()
            p.set('purpose', key)
            if (country) p.set('country', country)
            if (searchQuery) p.set('q', searchQuery)
            if (from) p.set('from', from)
            if (effectiveMood) p.set('mood', effectiveMood)
            return (
              <Link key={key} href={`/${locale}/companions?${p}`}>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${purpose === key ? 'bg-brand text-white' : 'bg-surface-sunken text-body hover:bg-brand-light'}`}>{label}</span>
              </Link>
            )
          })}
        </div>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(post => (
              <CompanionStoryCard
                key={post.id}
                locale={locale}
                post={post}
                profile={post.profiles as { full_name?: string | null; avatar_url?: string | null; trust_score?: number | null }}
                appCount={appCountMap[post.id] ?? 0}
                isBookmarked={bookmarkedIds.has(post.id)}
                userId={user?.id ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-2xl shadow-sm border border-edge">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-body mb-2">{td('noTripsYet')}</h3>
            <p className="text-subtle mb-6">{td('noTripsHint')}</p>
            <Link href={`/${locale}/companions/new`}>
              <Button className="bg-brand hover:bg-brand-hover rounded-full px-8">+ {t('post')}</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
