import { createClient, getAuthUser } from '@/utils/supabase/server'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import type { Metadata } from 'next'
import { getLanguageByCode } from '@/data/languages'
import { MapPin, Calendar, Users, Plus, ChevronRight } from 'lucide-react'
import CountrySearchSelect from './CountrySearchSelect'
import CountryFlag from '@/components/CountryFlag'
import TranslatedText from '@/components/TranslatedText'
import GuidesTabBar from '@/components/explore/GuidesTabBar'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import Avatar from '@/components/ui/Avatar'
import SmartImage from '@/components/ui/SmartImage'
import { relationOne, type ProfileRef } from '@/lib/db/relation'

interface GuideRequestCard {
  id: string
  user_id: string
  title: string
  destination_country: string
  destination_city: string | null
  start_date: string
  end_date: string
  cover_image: string | null
  preferred_languages: string[] | null
  profiles?: ProfileRef | ProfileRef[] | null
  /** `guide_applications (count)` 임베드. */
  guide_applications?: { count: number }[] | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SeoPages' })
  return buildPageMetadata({
    locale,
    path: '/guides/requests',
    title: t('guideRequestsTitle'),
    description: t('guideRequestsDesc'),
    keywords: ['local guide', 'guide request', 'private tour', 'mytripfy'],
  })
}

const POPULAR_COUNTRIES = ['JP', 'KR', 'TH', 'VN', 'ID', 'FR', 'IT', 'ES', 'US', 'AU', 'CN', 'TW', 'PH', 'SG', 'MY', 'GB', 'DE', 'CA', 'MX', 'BR']

export default async function GuideRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ country?: string; my?: string }>
}) {
  const { locale } = await params
  const { country, my } = await searchParams
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  const th = await getTranslations({ locale, namespace: 'HomeSection' })
  const tc = await getTranslations({ locale, namespace: 'Companions' })
  const tg = await getTranslations({ locale, namespace: 'Guides' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('guide_requests')
    .select(`*, profiles (id, full_name, avatar_url), guide_applications (count)`)
    .order('created_at', { ascending: false })

  if (!my) query = query.eq('status', 'open').gte('end_date', today)
  if (country) query = query.eq('destination_country', country)
  if (my === 'posted' && user) query = query.eq('user_id', user.id)
  if (my === 'applied' && user) {
    const { data: myApps } = await supabase
      .from('guide_applications').select('request_id').eq('guide_id', user.id)
    const ids = myApps?.map(a => a.request_id) ?? []
    query = ids.length > 0
      ? query.in('id', ids)
      : query.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: requests } = await query

  const popularCountries = POPULAR_COUNTRIES
    .map(code => getCountryByCode(code))
    .filter((c): c is NonNullable<typeof c> => c != null)
    .sort((a, b) => a.name.localeCompare(b.name))

  const selectedCountry = country ? getCountryByCode(country) : null
  const totalCount = requests?.length ?? 0

  return (
    <div className="min-h-screen bg-surface-warm">
      <Header locale={locale} />

      <section className="relative bg-midnight text-white py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-midnight to-gold-strong/25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">{tm('guidesTabRequests')}</h1>
          <p className="text-white/70 max-w-xl leading-relaxed">{th('guideRequestsSubtitle')}</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GuidesTabBar
          locale={locale}
          tabs={[
            { href: '/guides', label: tm('guidesTabGuides') },
            { href: '/guides/requests', label: tm('guidesTabRequests') },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-subtle text-sm">
            {totalCount > 0 && <span className="text-gold font-semibold">{th('openRequestsCount', { count: totalCount })}</span>}
          </p>
          <Link href={user ? `/${locale}/guides/requests/new` : `/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/guides/requests`)}`}>
            <Button className="bg-gold hover:brightness-95 rounded-full px-5 shrink-0 text-heading flex items-center gap-1.5 shadow-md shadow-gold/25">
              <Plus className="w-4 h-4" /> {th('postRequest')}
            </Button>
          </Link>
        </div>

        {/* ── 필터 바 ── */}
        <div className="bg-surface rounded-2xl shadow-sm border border-edge/60 mb-6">

          {/* 탭 (로그인 시) */}
          {user && (
            <div className="flex border-b border-edge rounded-t-2xl overflow-hidden">
              {[
                { label: th('allRequests'), value: undefined },
                { label: th('myRequests'), value: 'posted' },
                { label: th('myApplications'), value: 'applied' },
              ].map(tab => {
                const active = my === tab.value
                const href = tab.value
                  ? `/${locale}/guides/requests?my=${tab.value}${country ? `&country=${country}` : ''}`
                  : `/${locale}/guides/requests${country ? `?country=${country}` : ''}`
                return (
                  <Link key={tab.label ?? 'all'} href={href}
                    className={`flex-1 text-center py-3 text-sm font-medium transition-colors border-b-2 ${active ? 'border-gold text-gold' : 'border-transparent text-subtle hover:text-body'}`}>
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* 국가 필터 */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-hint" />
              <span className="text-xs font-semibold text-hint uppercase tracking-wide">{th('destination')}</span>
              {selectedCountry && (
                <Link href={my ? `/${locale}/guides/requests?my=${my}` : `/${locale}/guides/requests`}
                  className="ml-auto text-xs text-danger hover:text-danger">✕ {th('clearFilter')}</Link>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {!country ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gold text-heading">🌍 {th('allCountriesFilter')}</span>
              ) : (
                <Link href={my ? `/${locale}/guides/requests?my=${my}` : `/${locale}/guides/requests`}>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-sunken text-body hover:bg-surface-hover">🌍 {th('allCountriesFilter')}</span>
                </Link>
              )}
              {popularCountries.map(c => {
                const isSelected = country === c.code
                const href = isSelected
                  ? (my ? `/${locale}/guides/requests?my=${my}` : `/${locale}/guides/requests`)
                  : (my ? `/${locale}/guides/requests?country=${c.code}&my=${my}` : `/${locale}/guides/requests?country=${c.code}`)
                return (
                  <Link key={c.code} href={href}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${isSelected ? 'bg-gold text-heading' : 'bg-surface-sunken text-body hover:bg-gold-light'}`}>
                      <CountryFlag code={c.code} size="xs" />
                      {c.name}
                    </span>
                  </Link>
                )
              })}
              {/* 인기 목록에 없는 국가 검색 */}
              <CountrySearchSelect locale={locale} currentCountry={country} currentMy={my} />
            </div>
            {/* 선택된 국가가 인기 목록에 없을 때 표시 */}
            {selectedCountry && !popularCountries.find(c => c.code === country) && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gold-strong bg-gold-light border border-gold/30 rounded-lg px-3 py-1.5 w-fit">
                <CountryFlag code={selectedCountry.code} size="xs" />
                <span className="font-semibold">{selectedCountry.name}</span>
                <span className="text-gold">· {th('activeFilter')}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 요청 목록 ── */}
        {requests && requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req: GuideRequestCard) => {
              const countryInfo = getCountryByCode(req.destination_country)
              const profile = relationOne<ProfileRef>(req.profiles)
              const appCount = req.guide_applications?.[0]?.count || 0
              const startDate = new Date(req.start_date)
              const endDate = new Date(req.end_date)
              const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              const isOwn = user && req.user_id === user.id
              const isExpired = req.end_date < today

              return (
                <Link key={req.id} href={`/${locale}/guides/requests/${req.id}`}>
                  <div className="bg-surface rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-edge/60 hover:border-gold/30 h-full flex flex-col overflow-hidden group">

                    {/* 커버 */}
                    {req.cover_image ? (
                      <div className="w-full overflow-hidden" style={{ aspectRatio: '16/7' }}>
                        <SmartImage src={req.cover_image} alt="" width={800} height={350} sizes="(max-width: 768px) 100vw, 50vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-20 flex items-center justify-between px-5 bg-gradient-to-br from-gold to-gold/85">
                        <div>
                          <div className="text-white font-bold text-lg">{countryInfo?.emoji} {countryInfo?.name || req.destination_country}</div>
                          {req.destination_city && (
                            <div className="text-gold-light text-xs mt-0.5">📍 {req.destination_city}</div>
                          )}
                        </div>
                        <span className="text-white/80 text-2xl font-bold">{tg('nightsShort', { nights })}</span>
                      </div>
                    )}

                    <div className="p-4 flex flex-col flex-1">
                      {/* 상태 배지 + 커버 이미지일 때 국가 */}
                      <div className="flex items-center justify-between mb-2">
                        {req.cover_image && (
                          <div className="flex items-center gap-1 text-sm font-semibold text-heading">
                            <span>{countryInfo?.emoji}</span>
                            <span>{countryInfo?.name || req.destination_country}</span>
                            {req.destination_city && <span className="text-hint font-normal text-xs">· {req.destination_city.split(', ')[0]}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {isOwn && <span className="text-[10px] bg-brand-muted text-brand-strong px-1.5 py-0.5 rounded-full font-medium">{th('mineBadge')}</span>}
                          {isExpired
                            ? <span className="text-[10px] bg-surface-sunken text-subtle px-1.5 py-0.5 rounded-full font-medium">{th('expiredBadge')}</span>
                            : <span className="text-[10px] bg-success-light text-success-strong px-1.5 py-0.5 rounded-full font-medium">{th('openStatus')}</span>
                          }
                          <span className="text-[10px] bg-gold-light text-gold-strong border border-gold/25 px-1.5 py-0.5 rounded-full font-medium">{tc('nightsDays', { nights, days: nights + 1 })}</span>
                        </div>
                      </div>

                      {/* 제목 */}
                      <TranslatedText text={req.title} locale={locale} as="h3" className="font-bold text-heading mb-2 line-clamp-2 leading-snug text-sm" />

                      {/* 언어 */}
                      {req.preferred_languages && req.preferred_languages.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {req.preferred_languages.map((code) => {
                            const lang = getLanguageByCode(code)
                            return lang ? (
                              <span key={code} className="text-[10px] bg-purple-light text-purple-strong border border-purple-light px-1.5 py-0.5 rounded-full">
                                {lang.emoji} {lang.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}

                      {/* 날짜 */}
                      <div className="flex items-center gap-1 text-xs text-subtle mb-3">
                        <Calendar className="w-3 h-3" />
                        <span suppressHydrationWarning>
                          {startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* 하단: 작성자 + 지원자 수 */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-edge">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={profile?.avatar_url}
                            name={profile?.full_name}
                            size={24}
                            fallbackClassName="bg-gold-light text-gold-strong"
                          />
                          <span className="text-xs text-body font-medium truncate max-w-[100px]">
                            {profile?.full_name || th('traveler')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="w-3 h-3 text-hint" />
                          {appCount > 0 ? (
                            <span className="text-gold font-semibold">{th('appliedCount', { count: appCount })}</span>
                          ) : (
                            <span className="text-hint">{th('beFirst')}</span>
                          )}
                          <ChevronRight className="w-3 h-3 text-hint" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-body mb-2">
              {my === 'posted' ? th('noMyRequestsYet') : my === 'applied' ? th('noApplicationsYet') : th('noRequestsYet')}
            </h3>
            <p className="text-subtle mb-6">
              {my === 'posted' ? th('noMyRequestsYet') : my === 'applied' ? th('noApplicationsYet') : th('noRequestsHint')}
            </p>
            {!my && (
              <Link href={user ? `/${locale}/guides/requests/new` : `/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/guides/requests`)}`}>
                <Button className="bg-gold hover:brightness-95 text-heading rounded-full px-8">
                  {th('postGuideRequestBtn')}
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
