import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { createClient } from '@/utils/supabase/server'
import type { User } from '@supabase/supabase-js'
import Logo from '@/components/Logo'
import { getCountryByCode, getLevelInfo } from '@/data/countries'
import HomeSearch from '@/components/HomeSearch'
import CountryFlag from '@/components/CountryFlag'
import { Users, Plane, Compass, Globe, MessageSquare, ShieldCheck, Search, Star, UserCheck, Store, Trophy, Award, ClipboardList } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

const POPULAR_DESTINATIONS_FALLBACK = [
  'JP', 'TH', 'IT', 'FR', 'US', 'AU', 'ES', 'VN',
]
const POPULAR_DESTINATIONS_MAX = 8

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  let user: User | null = null
  let postCount = 0
  let guideCount = 0
  type PostRow = { id: string; destination_country: string; destination_city?: string | null; title: string; start_date: string; end_date: string; profiles: Record<string, unknown> }
  type GuideRow = { id: string; full_name: string | null; avatar_url: string | null; nationality?: string | null; travel_level?: number; trust_score?: number; guide_hourly_rate?: number }
  type GuideRequestRow = { id: string; title: string; destination_country: string; start_date: string; end_date: string; profiles: Record<string, unknown> }
  type LeaderboardRow = { id: string; full_name: string | null; avatar_url: string | null; total_points?: number }
  let recentPosts: PostRow[] | null = null
  let companionCountryRows: { destination_country: string | null }[] | null = null
  let topGuides: GuideRow[] | null = null
  let recentGuideRequests: GuideRequestRow[] | null = null
  let hallOfFameTop5: LeaderboardRow[] | null = null
  let h: (key: string) => string
  let s: (key: string) => string

  try {
    const supabase = await createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    user = u ?? null

    const [heroT, sectionT] = await Promise.all([
      getTranslations({ locale, namespace: 'Hero' }),
      getTranslations({ locale, namespace: 'HomeSection' }),
    ])
    h = heroT
    s = sectionT

    const today = new Date().toISOString().split('T')[0]

    const [
      { count: pc },
      { count: gc },
      { data: rp },
      { data: ccr },
      { data: tg },
      { data: rgr },
      { data: hf5 },
    ] = await Promise.all([
      supabase.from('companion_posts').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_guide', true),
      supabase
        .from('companion_posts')
        .select('*, profiles(id, full_name, avatar_url, travel_level, trust_score, nationality)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('companion_posts')
        .select('destination_country')
        .eq('status', 'open')
        .gte('end_date', today)
        .not('destination_country', 'is', null),
      supabase
        .from('profiles')
        .select('*')
        .eq('is_guide', true)
        .order('trust_score', { ascending: false })
        .limit(4),
      supabase
        .from('guide_requests')
        .select('*, profiles(id, full_name, avatar_url, nationality)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('overall_leaderboard')
        .select('id, full_name, avatar_url, total_points')
        .order('total_points', { ascending: false })
        .limit(5),
    ])
    postCount = pc ?? 0
    guideCount = gc ?? 0
    recentPosts = rp as PostRow[] | null
    companionCountryRows = ccr as { destination_country: string | null }[] | null
    topGuides = tg as GuideRow[] | null
    recentGuideRequests = rgr as GuideRequestRow[] | null
    hallOfFameTop5 = hf5 as LeaderboardRow[] | null
  } catch (err) {
    console.error('Home page data fetch error:', err)
    h = (key: string) => key
    s = (key: string) => key
  }

  // Popular Destinations: Find Companions 글 많은 순으로 국가 정렬 (상위 8개, 부족하면 fallback으로 채움)
  const countByCountry = new Map<string, number>()
  for (const row of companionCountryRows ?? []) {
    const code = (row as { destination_country: string | null }).destination_country
    if (code && code.trim()) {
      countByCountry.set(code, (countByCountry.get(code) ?? 0) + 1)
    }
  }
  const sortedCodes = [...countByCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => code)
    .slice(0, POPULAR_DESTINATIONS_MAX)
  const used = new Set(sortedCodes)
  for (const code of POPULAR_DESTINATIONS_FALLBACK) {
    if (sortedCodes.length >= POPULAR_DESTINATIONS_MAX) break
    if (!used.has(code)) {
      used.add(code)
      sortedCodes.push(code)
    }
  }
  const popularDestinations = sortedCodes.map(code => {
    const country = getCountryByCode(code)
    return { code, name: country?.name ?? code, emoji: country?.emoji ?? '🌍' }
  })

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header user={user} locale={locale} currentPath="/" />

      {/* ─── HERO (모바일·태블릿·데스크탑) ─── */}
      <section className="relative overflow-hidden min-h-0 sm:min-h-[400px] flex items-center">
        {/* 메인 배경 이미지: 다양한 인종의 남녀가 함께 여행을 떠나는 밝은 이미지 */}
        <div className="absolute inset-0">
          <img
            src="/hero-travel-together.jpg"
            alt="Travel together - diverse friends smiling"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-900/50 to-indigo-950/80 pointer-events-none" aria-hidden />
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-14 text-center">
          <h1 className="text-3xl min-[480px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-5 leading-tight tracking-tight px-0 sm:px-2">
            {h('title1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
              {h('title2')}
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-blue-200 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-1">
            {h('subtitle')}<br className="hidden sm:block" />
            {h('features')}
          </p>

          <div className="w-full px-0 sm:px-4">
            <HomeSearch locale={locale} />
          </div>
        </div>
      </section>

      {/* ─── Latest Trips ─── */}
      <section className="py-10 sm:py-14 md:py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{s('latestTitle')}</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{s('latestSubtitle')}</p>
            </div>
            <Link href="/companions" className="shrink-0 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 min-h-[44px] sm:min-h-0 px-4 sm:px-3 w-full sm:w-auto">
                {s('allTrips')} →
              </Button>
            </Link>
          </div>

          {recentPosts && recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {recentPosts.map(post => {
                const dest = getCountryByCode(post.destination_country)
                const poster = post.profiles as Record<string, unknown>
                const start = new Date(post.start_date)
                const end = new Date(post.end_date)
                const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <Link key={post.id} href={`/companions/${post.id}`}>
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 transition-all p-5 h-full flex flex-col cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CountryFlag code={post.destination_country} size="sm" />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{dest?.name || post.destination_country}</div>
                            {post.destination_city && (
                              <div className="text-xs text-gray-400 truncate max-w-[120px]">
                                {post.destination_city.split(', ')[0]}{post.destination_city.split(', ').length > 1 ? ` +${post.destination_city.split(', ').length - 1}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-1 rounded-full">
                          {nights}N {nights + 1}D
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1 mb-3">{post.title}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                            {(poster?.avatar_url as string) ? (
                              <img src={poster.avatar_url as string} alt="" className="w-full h-full object-cover" />
                            ) : <span className="text-xs text-blue-400">?</span>}
                          </div>
                          <span className="truncate max-w-[80px]">{(poster?.full_name as string) || s('anonymous')}</span>
                        </div>
                        <span suppressHydrationWarning>{start.toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : locale.startsWith('zh') ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{s('firstToPost')}</p>
              <Link href={user ? '/companions/new' : '/login'} className="inline-block mt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-6">{s('postTrip')}</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Popular Destinations (below Latest Trips) ─── */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{s('popularTitle')}</h2>
            <Link href="/companions" className="text-xs sm:text-sm text-blue-600 hover:underline font-medium touch-manipulation">
              {s('viewAll')} →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
            {popularDestinations.map(dest => (
              <Link key={dest.code} href={`/companions?country=${dest.code}`}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all cursor-pointer group">
                  <span className="group-hover:scale-110 transition-transform">
                    <CountryFlag code={dest.code} size="lg" />
                  </span>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">{dest.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Latest Guide Requests ─── */}
      {recentGuideRequests && recentGuideRequests.length > 0 && (
        <section className="py-10 sm:py-14 md:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">🧭 {s('guideRequestsTitle')}</h2>
                <p className="text-sm text-gray-500 mt-1">{s('guideRequestsSubtitle')}</p>
              </div>
              <Link href="/guides/requests">
                <Button variant="outline" size="sm" className="rounded-full border-amber-300 text-amber-600 hover:bg-amber-50">
                  {s('allRequests')} →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentGuideRequests.map(req => {
                const dest = getCountryByCode(req.destination_country)
                const poster = req.profiles as Record<string, unknown>
                const natCountry = poster?.nationality ? getCountryByCode(poster.nationality as string) : null
                const start = new Date(req.start_date)
                const end = new Date(req.end_date)
                const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <Link key={req.id} href={`/guides/requests/${req.id}`}>
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-transparent hover:border-amber-200 transition-all p-5 cursor-pointer h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{dest?.emoji || '🌍'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 text-sm truncate">{dest?.name || req.destination_country}</div>
                          <div className="text-xs text-amber-600 font-semibold">{nights}N {nights + 1}D</div>
                        </div>
                        <span className="shrink-0 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">{s('openStatus')}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1 mb-3">{req.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-50 pt-3">
                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                          {(poster?.avatar_url as string) ? (
                            <img src={poster.avatar_url as string} alt="" className="w-full h-full object-cover" />
                          ) : <span className="text-[10px] text-amber-400">?</span>}
                        </div>
                        <span className="truncate">{(poster?.full_name as string) || s('traveler')}</span>
                        {natCountry && <span className="ml-auto shrink-0">{natCountry.emoji}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-6 text-center">
              <Link href="/guides/requests/new">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8">
                  ✍️ {s('postGuideRequestBtn')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Top Guides (below Guide Requests) ─── */}
      {topGuides && topGuides.length > 0 && (
        <section className="py-10 sm:py-14 md:py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">{s('guidesTitle')}</h2>
                <p className="text-sm text-gray-500 mt-1">{s('guidesSubtitle')}</p>
              </div>
              <Link href="/guides">
                <Button variant="outline" size="sm" className="rounded-full border-yellow-300 text-yellow-600 hover:bg-yellow-50">
                  {s('allGuides')} →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topGuides.map(guide => {
                const levelInfo = getLevelInfo(guide.travel_level || 1)
                const natCountry = guide.nationality ? getCountryByCode(guide.nationality) : null
                const isFree = !guide.guide_hourly_rate || guide.guide_hourly_rate === 0
                return (
                  <Link key={guide.id} href={`/guides/${guide.id}`}>
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-transparent hover:border-yellow-200 transition-all p-5 cursor-pointer text-center">
                      <div className="relative inline-block mb-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mx-auto">
                          {guide.avatar_url ? (
                            <img src={guide.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : <Users className="w-7 h-7 text-gray-300" />}
                        </div>
                        {isFree && (
                          <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{s('free')}</span>
                        )}
                      </div>
                      <div className="font-bold text-gray-900 text-sm truncate">{guide.full_name || s('guideFallback')}</div>
                      {natCountry && (
                        <div className="text-xs text-gray-400 mt-0.5">{natCountry.emoji} {natCountry.name}</div>
                      )}
                      <div className="mt-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
                          {levelInfo.badge} Lv.{levelInfo.level}
                        </span>
                      </div>
                      {(guide.trust_score ?? 0) > 0 && (
                        <div className="text-xs text-yellow-500 mt-1.5 font-semibold">
                          {'★'.repeat(Math.round(guide.trust_score ?? 0))} {Number(guide.trust_score ?? 0).toFixed(1)}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Hall of Fame Top 5 ─── */}
      {hallOfFameTop5 && hallOfFameTop5.length > 0 && (
        <section className="py-10 sm:py-14 md:py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <h2 className="text-2xl font-extrabold text-gray-900">🏆 {s('hallOfFameTitle')}</h2>
              <Link href="/hall-of-fame">
                <Button variant="outline" size="sm" className="rounded-full border-amber-300 text-amber-600 hover:bg-amber-50">
                  {s('viewFullRanking')} →
                </Button>
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {hallOfFameTop5.map((row: { id: string; full_name: string | null; avatar_url: string | null; total_points?: number }, idx: number) => (
                <Link key={row.id} href={`/users/${row.id}`}>
                  <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md border border-transparent hover:border-amber-100 transition-all">
                    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-gray-400"><Users className="w-5 h-5" /></span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 flex-1 truncate">{row.full_name || s('traveler')}</span>
                    <span className="text-amber-600 font-bold shrink-0">{row.total_points ?? 0} {s('pts')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Features ─── */}
      <section className="py-10 sm:py-14 md:py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 sm:mb-3">{s('featuresTitle')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-xs sm:text-sm px-2">{s('featuresSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Users, titleKey: 'featureFindCompanions', descKey: 'featureFindCompanionsDesc', color: 'bg-blue-600', href: '/companions' },
              { icon: Compass, titleKey: 'featureFindGuides', descKey: 'featureFindGuidesDesc', color: 'bg-amber-500', href: '/guides' },
              { icon: ClipboardList, titleKey: 'featureGuideRequests', descKey: 'featureGuideRequestsDesc', color: 'bg-orange-500', href: '/guides/requests' },
              { icon: Store, titleKey: 'featureSponsors', descKey: 'featureSponsorsDesc', color: 'bg-emerald-600', href: '/sponsors' },
              { icon: Trophy, titleKey: 'featureChallenges', descKey: 'featureChallengesDesc', color: 'bg-purple-600', href: '/challenges' },
              { icon: Award, titleKey: 'featureHallOfFame', descKey: 'featureHallOfFameDesc', color: 'bg-amber-600', href: '/hall-of-fame' },
              { icon: Star, titleKey: 'featureLevelBadges', descKey: 'featureLevelBadgesDesc', color: 'bg-indigo-600', href: '/hall-of-fame' },
              { icon: MessageSquare, titleKey: 'featureChat', descKey: 'featureChatDesc', color: 'bg-pink-600', href: '/messages' },
              { icon: ShieldCheck, titleKey: 'featureVerified', descKey: 'featureVerifiedDesc', color: 'bg-slate-600', href: '/profile' },
            ].map(f => {
              const card = (
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 border border-gray-100 h-full hover:border-gray-200 cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{s(f.titleKey)}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s(f.descKey)}</p>
                  </div>
                </div>
              )
              return f.href ? (
                <Link key={f.titleKey} href={f.href} className="block">
                  {card}
                </Link>
              ) : (
                <div key={f.titleKey}>{card}</div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-10 sm:py-14 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">{s('howTitle')}</h2>
          </div>
          <div className="relative">
            <div className="hidden sm:block absolute top-7 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gray-200" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative">
              {[
                { step: '01', icon: UserCheck, titleKey: 'howStep1Title', descKey: 'howStep1Desc' },
                { step: '02', icon: Search, titleKey: 'howStep2Title', descKey: 'howStep2Desc' },
                { step: '03', icon: Star, titleKey: 'howStep3Title', descKey: 'howStep3Desc' },
              ].map(item => (
                <div key={item.step} className="text-center relative">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-black text-blue-500 tracking-widest mb-2">{s('howStepLabel')} {item.step}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{s(item.titleKey)}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s(item.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      {!user && (
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 sm:mb-4">
              {s('ctaTitle')}
            </h2>
            <p className="text-blue-200 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
              {s('ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 rounded-full px-10 py-5 sm:py-6 text-base sm:text-lg font-bold shadow-xl w-full sm:w-auto min-h-[48px]">
                  {s('joinFree')}
                </Button>
              </Link>
              <Link href="/companions" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/20 rounded-full px-10 py-5 sm:py-6 text-base sm:text-lg font-medium w-full sm:w-auto min-h-[48px]">
                  {s('browseTrips')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 py-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <Logo className="h-10 brightness-0 invert" />
              <p className="text-sm text-gray-500 mt-3 max-w-xs leading-relaxed">
                {s('footerTagline')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:gap-8 text-sm w-full sm:w-auto">
              <div>
                <div className="text-white font-semibold mb-3">{s('footerExplore')}</div>
                <div className="space-y-2">
                  <div><Link href="/companions" className="hover:text-white transition-colors">{s('viewAll')}</Link></div>
                  <div><Link href="/guides" className="hover:text-white transition-colors">{s('allGuides')}</Link></div>
                  <div><Link href="/challenges" className="hover:text-white transition-colors">{s('footerChallenges')}</Link></div>
                  <div><Link href="/personality" className="hover:text-white transition-colors">{s('personalityTest')}</Link></div>
                </div>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">{s('footerAccount')}</div>
                <div className="space-y-2">
                  {user ? (
                    <>
                      <div><Link href="/dashboard" className="hover:text-white transition-colors">{s('footerDashboard')}</Link></div>
                      <div><Link href="/profile" className="hover:text-white transition-colors">{s('myProfile')}</Link></div>
                      <div><Link href="/bookmarks" className="hover:text-white transition-colors">{s('footerBookmarks')}</Link></div>
                    </>
                  ) : (
                    <div><Link href="/login" className="hover:text-white transition-colors">{s('footerLoginSignUp')}</Link></div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 text-xs text-gray-600">
            <div className="flex flex-col gap-0.5">
              <span>© 2026 mytripfy.com · {s('allRightsReserved')}</span>
              <span>{s('footerRightsContact')}</span>
              <Link href="/privacy" className="hover:text-white transition-colors mt-0.5 underline underline-offset-2">
                {s('privacyPolicy')}
              </Link>
            </div>
            <span className="shrink-0">{s('footerMadeFor')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
