import { createClient } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getLevelInfo, getCountryByCode } from '@/data/countries'
import BookmarkButton from '@/components/BookmarkButton'
import GuideRateDisplay from '@/components/GuideRateDisplay'
import type { Metadata } from 'next'
import { getLanguageByCode, getLevelInfo as getLangLevel, type LanguageSkill } from '@/data/languages'
import type { GuideRegion } from '@/data/cities'
import GuidesFilterBar from './GuidesFilterBar'
import CountryFlag from '@/components/CountryFlag'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Guides' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaOgTitle'),
      description: t('metaOgDescription'),
    },
  }
}

export default async function GuidesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    country?: string; city?: string; vehicle?: string
    accommodation?: string; free?: string; lang?: string
    sort?: string; q?: string; allGuides?: string
  }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Guides' })
  const { country, city, vehicle, accommodation, free, lang, sort = 'rating', q, allGuides } = await searchParams
  const showAllGuides = allGuides === '1'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── 정렬 기준 ──
  const orderMap: Record<string, { col: string; asc: boolean }> = {
    rating:  { col: 'trust_score',   asc: false },
    reviews: { col: 'review_count',  asc: false },
    level:   { col: 'travel_level',  asc: false },
    newest:  { col: 'created_at',    asc: false },
  }
  const { col: orderCol, asc: orderAsc } = orderMap[sort] ?? orderMap.rating

  // ── 쿼리 ──
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_guide', true)
    .order(orderCol, { ascending: orderAsc })
    .order('created_at', { ascending: false })

  if (country) query = query.contains('guide_regions', [country])
  if (vehicle === '1') query = query.eq('guide_has_vehicle', true)
  if (accommodation === '1') query = query.eq('guide_has_accommodation', true)
  if (free === '1') query = query.or('guide_hourly_rate.is.null,guide_hourly_rate.eq.0')

  let { data: guides } = await query

  // 이름 검색 (클라이언트 필터)
  if (q && guides) {
    const ql = q.toLowerCase()
    guides = guides.filter(g => (g.full_name as string | null)?.toLowerCase().includes(ql))
  }

  // 언어 필터
  if (lang && guides) {
    guides = guides.filter(g => {
      const skills = g.spoken_languages as LanguageSkill[] | null
      return skills?.some(s => s.lang === lang)
    })
  }

  // 도시 필터
  if (city && guides) {
    const cl = city.toLowerCase()
    guides = guides.filter(g => {
      const regions = g.guide_city_regions as GuideRegion[] | null
      return regions?.some(r => r.cities.some(c => c.toLowerCase().includes(cl)))
    })
  }

  // 북마크
  const { data: myBookmarks } = user
    ? await supabase.from('bookmarks').select('reference_id').eq('user_id', user.id).eq('type', 'guide')
    : { data: [] }
  const bookmarkedIds = new Set(myBookmarks?.map(b => b.reference_id) ?? [])

  const totalCount = guides?.length ?? 0
  const GUIDES_PREVIEW_LIMIT = 12
  const displayedGuides = showAllGuides ? (guides ?? []) : (guides ?? []).slice(0, GUIDES_PREVIEW_LIMIT)
  const hasMoreGuides = !showAllGuides && totalCount > GUIDES_PREVIEW_LIMIT

  function guidesQueryString(includeAllGuides: boolean) {
    const p = new URLSearchParams()
    if (country) p.set('country', country)
    if (city) p.set('city', city)
    if (vehicle) p.set('vehicle', vehicle)
    if (accommodation) p.set('accommodation', accommodation)
    if (free) p.set('free', free)
    if (lang) p.set('lang', lang)
    if (sort && sort !== 'rating') p.set('sort', sort)
    if (q) p.set('q', q)
    if (includeAllGuides) p.set('allGuides', '1')
    const s = p.toString()
    return s ? `?${s}` : ''
  }

  // Guide Requests: 진행 중인 오픈 요청 최신순 (최대 8개)
  const today = new Date().toISOString().split('T')[0]
  const { data: guideRequests } = await supabase
    .from('guide_requests')
    .select('id, title, destination_country, destination_city, start_date, end_date, created_at')
    .eq('status', 'open')
    .gte('end_date', today)
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/guides" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── 헤더 ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">🧭 {t('title')}</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {totalCount > 0
                ? (hasMoreGuides ? t('subtitleCountOf', { displayed: displayedGuides.length, total: totalCount }) : t('subtitleGuidesFound', { total: totalCount }))
                : t('discoverWorldwide')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={user ? `/${locale}/guides/requests/new` : `/${locale}/login`}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full text-sm">
                📋 {t('guideRequestsBtn')}
              </Button>
            </Link>
            {user && (
              <Link href={`/${locale}/profile/edit`}>
                <Button variant="outline" className="border-amber-400 text-amber-600 hover:bg-amber-50 rounded-full text-sm">
                  + {t('registerAsGuide')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ── 필터 바 ── */}
        <GuidesFilterBar
          locale={locale}
          currentFilters={{ country, city, lang, vehicle, accommodation, free, sort, q }}
        />

        {/* ── 가이드 그리드 ── */}
        {displayedGuides.length > 0 ? (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedGuides.map(guide => {
              const levelInfo = getLevelInfo(guide.travel_level || 1)
              const nationalityCountry = guide.nationality ? getCountryByCode(guide.nationality) : null
              const skills = (guide.spoken_languages as LanguageSkill[] | null) ?? []
              const regions = (guide.guide_city_regions as GuideRegion[] | null) ?? []

              return (
                <div key={guide.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-amber-200 flex flex-col">

                  {/* 커버 + 아바타 */}
                  <div className="h-16 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 relative shrink-0 rounded-t-2xl overflow-hidden">
                    {/* 레벨 배지 */}
                    <div
                      className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm"
                      style={{ backgroundColor: levelInfo.color }}
                    >
                      {levelInfo.badge} Lv.{guide.travel_level || 1}
                    </div>
                    {/* 북마크 */}
                    {user && (
                      <div className="absolute top-2 left-2">
                        <BookmarkButton
                          userId={user.id}
                          type="guide"
                          referenceId={guide.id}
                          isBookmarked={bookmarkedIds.has(guide.id)}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  <Link href={`/${locale}/guides/${guide.id}`} className="flex flex-col flex-1 px-4 pb-4">
                    {/* 아바타 */}
                    <div className="-mt-7 mb-3 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl shadow-md overflow-hidden ring-3 ring-white" style={{ boxShadow: '0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.12)' }}>
                        {guide.avatar_url
                          ? <img src={guide.avatar_url} alt="" className="w-full h-full object-cover" />
                          : '👤'}
                      </div>
                    </div>

                    {/* 이름 + 국적 */}
                    <div className="mb-2">
                      <div className="font-bold text-gray-900 text-sm leading-tight truncate">
                        {guide.full_name || t('anonymousGuide')}
                      </div>
                      {nationalityCountry && (
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <CountryFlag code={nationalityCountry.code} size="xs" />
                          {nationalityCountry.name}
                        </div>
                      )}
                    </div>

                    {/* 평점 */}
                    {guide.trust_score > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-yellow-400 text-xs">
                          {'★'.repeat(Math.round(guide.trust_score))}{'☆'.repeat(5 - Math.round(guide.trust_score))}
                        </span>
                        <span className="text-xs font-bold text-gray-700">{Number(guide.trust_score).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({guide.review_count})</span>
                      </div>
                    )}

                    {/* Bio */}
                    {guide.bio && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{guide.bio}</p>
                    )}

                    {/* 언어 */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {skills.slice(0, 3).map(skill => {
                          const l = getLanguageByCode(skill.lang)
                          const lvl = getLangLevel(skill.level)
                          return l ? (
                            <span key={skill.lang}
                              className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${lvl.bgColor} ${lvl.textColor}`}>
                              {l.emoji} {l.name}
                            </span>
                          ) : null
                        })}
                        {skills.length > 3 && <span className="text-[10px] text-gray-400 self-center">+{skills.length - 3}</span>}
                      </div>
                    )}

                    {/* 활동 지역 */}
                    {regions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {regions.slice(0, 2).map(region => {
                          const c = getCountryByCode(region.country)
                          return (
                            <div key={region.country} className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-1.5 py-0.5">
                              <CountryFlag code={region.country} size="xs" />
                              <span className="text-[10px] font-medium text-amber-800">{c?.name || region.country}</span>
                              {region.cities.length > 0 && (
                                <span className="text-[10px] text-amber-600 truncate max-w-[60px]">
                                  · {region.cities.slice(0, 1).join(', ')}{region.cities.length > 1 ? ` +${region.cities.length - 1}` : ''}
                                </span>
                              )}
                            </div>
                          )
                        })}
                        {regions.length > 2 && <span className="text-[10px] text-gray-400 self-center">+{regions.length - 2}</span>}
                      </div>
                    )}

                    {/* 서비스 배지 */}
                    {(guide.guide_has_vehicle || guide.guide_has_accommodation || guide.email_verified) && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {guide.guide_has_vehicle && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">🚗 {t('badgeVehicle')}</span>}
                        {guide.guide_has_accommodation && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full border border-green-100">🏠 {t('badgeStay')}</span>}
                        {guide.email_verified && <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-100">✅ {t('badgeVerified')}</span>}
                      </div>
                    )}

                    {/* 하단: 방문 국가 수 + 요금 */}
                    <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        🌍 {t('countriesCount', { count: guide.travel_count || 0 })}
                      </span>
                      <GuideRateDisplay
                        rate={guide.guide_hourly_rate}
                        rateCurrency={guide.rate_currency}
                        size="sm"
                      />
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
          {hasMoreGuides && (
            <div className="mt-4 text-center">
              <Link href={`/${locale}/guides${guidesQueryString(true)}`}>
                <Button variant="outline" className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50">
                  {t('viewAllGuides', { count: totalCount })}
                </Button>
              </Link>
            </div>
          )}
          {showAllGuides && totalCount > GUIDES_PREVIEW_LIMIT && (
            <div className="mt-4 text-center">
              <Link href={`/${locale}/guides${guidesQueryString(false)}`}>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  {t('showLess')}
                </Button>
              </Link>
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">🧭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">{t('noGuidesFound')}</h3>
            <p className="text-gray-500 mb-6">{t('adjustFiltersOrRegister')}</p>
            <Link href={user ? `/${locale}/profile/edit` : `/${locale}/login`}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8">
                {t('registerAsGuideBtn')}
              </Button>
            </Link>
          </div>
        )}

        {/* ── Guide Requests 섹션 ── */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-extrabold text-gray-900">📋 {t('guideRequestsSection')}</h2>
            <Link href={`/${locale}/guides/requests`}>
              <Button variant="outline" size="sm" className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50 text-xs">
                {t('viewAll')}
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mb-4">{t('travelersLookingForGuides')}</p>
          {guideRequests && guideRequests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {guideRequests.map((req: { id: string; title: string; destination_country: string; destination_city?: string | null; start_date: string; end_date: string }) => {
                const countryInfo = getCountryByCode(req.destination_country)
                const startDate = new Date(req.start_date)
                const endDate = new Date(req.end_date)
                const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <Link key={req.id} href={`/${locale}/guides/requests/${req.id}`}>
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-transparent hover:border-amber-200 p-4 transition-all h-full flex flex-col">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-lg shrink-0">{countryInfo?.emoji || '🌍'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-sm line-clamp-2">{req.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {countryInfo?.name || req.destination_country}
                            {req.destination_city ? ` · ${req.destination_city}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-amber-600 font-medium mt-auto pt-2 border-t border-gray-50">
                        {startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} · {nights}N
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm py-8 px-4 text-center">
              <p className="text-gray-500 text-sm mb-3">{t('noOpenGuideRequests')}</p>
              <Link href={user ? `/${locale}/guides/requests/new` : `/${locale}/login`}>
                <Button size="sm" variant="outline" className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50">
                  {t('postRequest')}
                </Button>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
