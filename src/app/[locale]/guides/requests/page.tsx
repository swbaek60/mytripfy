import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import type { Metadata } from 'next'
import { getLanguageByCode } from '@/data/languages'
import { MapPin, Calendar, Users, Plus, ChevronRight } from 'lucide-react'
import CountrySearchSelect from './CountrySearchSelect'
import CountryFlag from '@/components/CountryFlag'

export const metadata: Metadata = {
  title: 'Guide Requests – Find a Local Guide',
  description: 'Browse guide requests by travelers. Apply as a guide or post your own request to find a local guide for your trip.',
  openGraph: {
    title: 'Guide Requests | mytripfy',
    description: 'Find or offer guide services for trips worldwide.',
  },
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/guides" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── 헤더 ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">📋 Guide Requests</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Travelers looking for local guides
              {totalCount > 0 && <span className="ml-1 text-amber-600 font-semibold">· {totalCount} open requests</span>}
            </p>
          </div>
          <Link href={user ? `/${locale}/guides/requests/new` : `/${locale}/login`}>
            <Button className="bg-amber-500 hover:bg-amber-600 rounded-full px-5 shrink-0 text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Post a Request
            </Button>
          </Link>
        </div>

        {/* ── 필터 바 ── */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">

          {/* 탭 (로그인 시) */}
          {user && (
            <div className="flex border-b border-gray-100 rounded-t-2xl overflow-hidden">
              {[
                { label: 'All Requests', value: undefined },
                { label: 'My Requests', value: 'posted' },
                { label: 'My Applications', value: 'applied' },
              ].map(tab => {
                const active = my === tab.value
                const href = tab.value
                  ? `/${locale}/guides/requests?my=${tab.value}${country ? `&country=${country}` : ''}`
                  : `/${locale}/guides/requests${country ? `?country=${country}` : ''}`
                return (
                  <Link key={tab.label ?? 'all'} href={href}
                    className={`flex-1 text-center py-3 text-sm font-medium transition-colors border-b-2 ${active ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* 국가 필터 */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Destination</span>
              {selectedCountry && (
                <Link href={my ? `/${locale}/guides/requests?my=${my}` : `/${locale}/guides/requests`}
                  className="ml-auto text-xs text-red-400 hover:text-red-600">✕ Clear</Link>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {!country ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500 text-white">🌍 All</span>
              ) : (
                <Link href={my ? `/${locale}/guides/requests?my=${my}` : `/${locale}/guides/requests`}>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">🌍 All</span>
                </Link>
              )}
              {popularCountries.map(c => {
                const isSelected = country === c.code
                const href = isSelected
                  ? (my ? `/${locale}/guides/requests?my=${my}` : `/${locale}/guides/requests`)
                  : (my ? `/${locale}/guides/requests?country=${c.code}&my=${my}` : `/${locale}/guides/requests?country=${c.code}`)
                return (
                  <Link key={c.code} href={href}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'}`}>
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
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit">
                <CountryFlag code={selectedCountry.code} size="xs" />
                <span className="font-semibold">{selectedCountry.name}</span>
                <span className="text-amber-500">· active filter</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 요청 목록 ── */}
        {requests && requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req: any) => {
              const countryInfo = getCountryByCode(req.destination_country)
              const profile = req.profiles as Record<string, unknown>
              const appCount = (req.guide_applications as { count: number }[])?.[0]?.count || 0
              const startDate = new Date(req.start_date)
              const endDate = new Date(req.end_date)
              const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              const isOwn = user && req.user_id === user.id
              const isExpired = req.end_date < today

              return (
                <Link key={req.id} href={`/${locale}/guides/requests/${req.id}`}>
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-amber-200 h-full flex flex-col overflow-hidden group">

                    {/* 커버 */}
                    {req.cover_image ? (
                      <div className="w-full overflow-hidden" style={{ aspectRatio: '16/7' }}>
                        <img src={req.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-20 flex items-center justify-between px-5"
                        style={{ background: `linear-gradient(135deg, #f59e0b, #f97316)` }}>
                        <div>
                          <div className="text-white font-bold text-lg">{countryInfo?.emoji} {countryInfo?.name || req.destination_country}</div>
                          {req.destination_city && (
                            <div className="text-amber-100 text-xs mt-0.5">📍 {req.destination_city}</div>
                          )}
                        </div>
                        <span className="text-white/80 text-2xl font-bold">{nights}N</span>
                      </div>
                    )}

                    <div className="p-4 flex flex-col flex-1">
                      {/* 상태 배지 + 커버 이미지일 때 국가 */}
                      <div className="flex items-center justify-between mb-2">
                        {req.cover_image && (
                          <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                            <span>{countryInfo?.emoji}</span>
                            <span>{countryInfo?.name || req.destination_country}</span>
                            {req.destination_city && <span className="text-gray-400 font-normal text-xs">· {req.destination_city.split(', ')[0]}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {isOwn && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Mine</span>}
                          {isExpired
                            ? <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">Expired</span>
                            : <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">Open</span>
                          }
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-full font-medium">{nights}N {nights + 1}D</span>
                        </div>
                      </div>

                      {/* 제목 */}
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-snug text-sm">{req.title}</h3>

                      {/* 언어 */}
                      {req.preferred_languages && (req.preferred_languages as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(req.preferred_languages as string[]).map((code: string) => {
                            const lang = getLanguageByCode(code)
                            return lang ? (
                              <span key={code} className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded-full">
                                {lang.emoji} {lang.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}

                      {/* 날짜 */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Calendar className="w-3 h-3" />
                        <span suppressHydrationWarning>
                          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* 하단: 작성자 + 지원자 수 */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                            {(profile?.avatar_url as string)
                              ? <img src={profile.avatar_url as string} alt="" className="w-full h-full object-cover" />
                              : <span className="text-[10px] text-amber-600 font-bold">?</span>}
                          </div>
                          <span className="text-xs text-gray-600 font-medium truncate max-w-[100px]">
                            {(profile?.full_name as string) || 'Traveler'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="w-3 h-3 text-gray-400" />
                          {appCount > 0 ? (
                            <span className="text-amber-600 font-semibold">{appCount} applied</span>
                          ) : (
                            <span className="text-gray-400">Be first!</span>
                          )}
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {my === 'posted' ? 'No requests posted yet' : my === 'applied' ? 'No applications yet' : 'No guide requests yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {my === 'posted' ? "You haven't posted any guide requests." : my === 'applied' ? "You haven't applied to any requests." : 'Be the first to post a guide request!'}
            </p>
            {!my && (
              <Link href={user ? `/${locale}/guides/requests/new` : `/${locale}/login`}>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8">
                  Post a Guide Request
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
