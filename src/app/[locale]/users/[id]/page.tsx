import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { getLevelInfo, getCountryByCode } from '@/data/countries'
import { Button } from '@/components/ui/button'
import ReviewForm from './reviews/ReviewForm'
import ReviewActions from './reviews/ReviewActions'
import { MessageSquare, Trophy } from 'lucide-react'
import { getLanguageByCode, getLevelInfo as getLangLevel, type LanguageSkill } from '@/data/languages'
import type { GuideRegion } from '@/data/cities'
import UserChallengeAchievements from '@/components/UserChallengeAchievements'
import SponsorVisitList from '@/components/SponsorVisitList'
import { getPersonalityDisplay } from '@/data/personalityTypes'
import { getTranslations } from 'next-intl/server'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const isOwnProfile = currentUser?.id === id

  const levelInfo = getLevelInfo(profile.travel_level || 1)

  // 방문 국가 목록
  const { data: visitedCountries } = await supabase
    .from('visited_countries')
    .select('country_code, country_name')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // 올린 동행 모집글
  const { data: companionPosts } = await supabase
    .from('companion_posts')
    .select('id, title, destination_country, start_date, end_date, status, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(6)

  // 후기 목록
  // profiles!reviews_reviewer_id_fkey: reviewer_id FK 명시 (reviewee_id FK와 구분)
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, rating, content, tags, created_at, reviewer_id, profiles!reviews_reviewer_id_fkey(full_name, avatar_url, travel_level)')
    .eq('reviewee_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // FK 명시가 실패할 경우 fallback: join 없이 기본 필드만 가져옴
  const reviewList = reviewsError ? [] : (reviews ?? [])

  // 내가 이 유저에게 이미 후기를 썼는지 확인
  let alreadyReviewed = false
  if (currentUser && !isOwnProfile) {
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', currentUser.id)
      .eq('reviewee_id', id)
      .is('post_id', null)
      .maybeSingle()
    alreadyReviewed = !!existingReview
  }

  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length).toFixed(1)
    : null

  // 챌린지 인증 목록 (타인 프로필에서 여행 경험 표시)
  const { data: certifications } = await supabase
    .from('challenge_certifications')
    .select('id, challenge_id, image_url, created_at, dispute_status, challenges(id, title_en, title_ko, category, image_url)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const certificationList = (certifications ?? []) as unknown as Array<{
    id: string
    challenge_id: string
    image_url: string | null
    created_at: string
    dispute_status?: string
    challenges: { id: string; title_en: string; title_ko: string | null; category: string; image_url: string | null } | null
  }>

  // Countries: 100 Countries 챌린지 인증 수와 방문 국가 수 중 큰 값 표시
  const countriesCertCount = certificationList.filter((c) => c.challenges?.category === 'countries').length
  const countriesCount = Math.max(countriesCertCount, visitedCountries?.length ?? 0)

  // 딴지걸기 지원: 현재 로그인 유저의 인증 수 + 이미 딴지 건 목록
  let myCertCount = 0
  let myDisputedKeys = new Set<string>()
  if (currentUser && !isOwnProfile) {
    const [certCountRes, disputesRes] = await Promise.all([
      supabase.from('challenge_certifications').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
      supabase.from('challenge_disputes').select('cert_challenge_id').eq('reporter_id', currentUser.id).eq('cert_user_id', id),
    ])
    myCertCount = certCountRes.count || 0
    myDisputedKeys = new Set((disputesRes.data || []).map((d: { cert_challenge_id: string }) => `${id}_${d.cert_challenge_id}`))
  }

  // 명예의 전당과 동일: 경험(챌린지+스폰서 방문) · 기여(동행·가이드·리뷰)
  const [
    { data: expRow },
    { data: contribRow },
  ] = await Promise.all([
    supabase.from('hall_of_fame_leaderboard').select('challenge_points').eq('id', id).maybeSingle(),
    supabase.from('contribution_leaderboard').select('contribution_points').eq('id', id).maybeSingle(),
  ])
  const experiencePoints = (expRow as { challenge_points?: number } | null)?.challenge_points ?? profile?.challenge_points ?? 0
  const contributionPoints = (contribRow as { contribution_points?: number } | null)?.contribution_points ?? 0

  // 스폰서 매장 방문 인증 (approved만 공개)
  const { data: sponsorVisits } = await supabase
    .from('sponsor_visits')
    .select('id, sponsor_id, photo_url, points_granted, created_at, sponsors(id, name, name_en, country_code, city)')
    .eq('user_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  type SponsorInfoUser = { id: string; name: string | null; name_en: string | null; country_code: string | null; city: string | null }
  const rawVisitList = (sponsorVisits ?? []) as Array<{ id: string; sponsor_id: string; photo_url: string; points_granted: number; created_at: string; sponsors: SponsorInfoUser | SponsorInfoUser[] | null }>
  const visitList = rawVisitList.map(row => ({
    ...row,
    sponsors: Array.isArray(row.sponsors) ? row.sponsors[0] ?? null : row.sponsors,
  }))

  let myDisputedVisitIds = new Set<string>()
  if (currentUser && id !== currentUser.id && visitList.length > 0) {
    const visitIds = visitList.map((v) => v.id)
    const { data: disputed } = await supabase
      .from('sponsor_visit_disputes')
      .select('visit_id')
      .eq('reporter_id', currentUser.id)
      .in('visit_id', visitIds)
    myDisputedVisitIds = new Set((disputed ?? []).map((d: { visit_id: string }) => d.visit_id))
  }

  const { data: travelPersonality } = await supabase
    .from('travel_personalities')
    .select('personality_type, personality_desc, scores')
    .eq('id', id)
    .maybeSingle()

  const t = await getTranslations({ locale, namespace: 'Profile' })

  const socialLinks = [
    { key: 'instagram_url', label: 'Instagram', icon: '📸', prefix: '' },
    { key: 'twitter_url', label: 'X/Twitter', icon: '🐦', prefix: '' },
    { key: 'facebook_url', label: 'Facebook', icon: '👥', prefix: '' },
    { key: 'website_url', label: 'Website', icon: '🌐', prefix: '' },
  ]

  const badges = [
    { key: 'email_verified', label: 'Email Verified', icon: '📧', color: 'bg-green-100 text-green-700' },
    { key: 'phone_verified', label: 'Phone Verified', icon: '📱', color: 'bg-blue-100 text-blue-700' },
    { key: 'sns_verified', label: 'SNS Verified', icon: '✅', color: 'bg-purple-100 text-purple-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} locale={locale} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-4xl shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
              ) : '👤'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || profile.username || 'Anonymous'}
                </h1>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: levelInfo.color }}
                >
                  {levelInfo.badge} Lv.{levelInfo.level} {levelInfo.title}
                </span>
                {profile.is_guide && (
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    🧭 Local Guide
                  </span>
                )}
              </div>

              {/* Nationality */}
              {profile.nationality && (
                <p className="text-sm text-gray-500 mb-2">
                  {getCountryByCode(profile.nationality)?.emoji} {getCountryByCode(profile.nationality)?.name}
                </p>
              )}

              {/* Verification badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {badges.map(b => profile[b.key as keyof typeof profile] && (
                  <span key={b.key} className={`text-xs px-2.5 py-1 rounded-full font-medium ${b.color}`}>
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
              )}
            </div>

            {/* CTA buttons */}
            {!isOwnProfile && currentUser && (
              <div className="flex flex-col gap-2 shrink-0">
                <Link href={`/${locale}/messages/${id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl text-sm">
                    💬 Message
                  </Button>
                </Link>
              </div>
            )}
            {isOwnProfile && (
              <Link href={`/${locale}/profile`}>
                <Button variant="outline" className="rounded-xl text-sm border-gray-300">
                  ✏️ Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Row — 명예의 전당과 동일하게 경험·기여 점수 표시 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{countriesCount}</p>
            <p className="text-sm text-gray-500 mt-1">Countries</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-amber-600 flex items-center justify-center gap-1">
              <Trophy className="w-6 h-6" />
              {experiencePoints}
            </p>
            <p className="text-sm text-gray-500 mt-1">{locale.startsWith('ko') ? '경험' : 'Experience'} pts</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-amber-600 flex items-center justify-center gap-1">
              <Trophy className="w-6 h-6" />
              {contributionPoints}
            </p>
            <p className="text-sm text-gray-500 mt-1">{locale.startsWith('ko') ? '기여' : 'Contribution'} pts</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{companionPosts?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Trip Posts</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-yellow-600">{profile.review_count || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Reviews</p>
          </div>
        </div>

        {/* Travel Personality (작성한 경우만 표시) */}
        {travelPersonality?.personality_type && (() => {
          const p = getPersonalityDisplay(travelPersonality.personality_type)
          if (!p) return null
          const desc = travelPersonality.personality_desc || p.desc
          const scores = (travelPersonality.scores as Record<string, string> | null) ?? {}
          const hasScores = Object.keys(scores).length > 0
          return (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🧠 {t('travelPersonalityTitle')}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-4xl shrink-0">{p.emoji}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg" style={{ color: p.color }}>{p.type}</p>
                    {desc && <p className="text-gray-600 text-sm leading-relaxed mt-1">{desc}</p>}
                  </div>
                </div>
                {hasScores && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="font-semibold text-gray-700 text-sm mb-3">{t('travelPersonalityDna')}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {Object.entries(scores).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500 capitalize">{key}</span>
                          <span className="font-medium text-gray-700 capitalize">{String(val).replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* 챌린지 인증 (여행 경험 표시) */}
        <UserChallengeAchievements
          userId={id}
          certifications={certificationList}
          challengePoints={profile.challenge_points ?? 0}
          experiencePoints={experiencePoints}
          contributionPoints={contributionPoints}
          locale={locale}
          currentUserId={currentUser?.id}
          myCertCount={myCertCount}
          disputedKeys={myDisputedKeys}
        />

        {/* 스폰서 매장 방문 인증 (딴지걸기 가능) */}
        <SponsorVisitList
          visits={visitList}
          locale={locale}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUser?.id}
          myCertCount={myCertCount}
          myDisputedVisitIds={myDisputedVisitIds}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Guide Info (전체 너비) */}
          {profile.is_guide && (
            <div className="md:col-span-2 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">🧭 Guide Info</h2>
              <div className="space-y-3">
                {profile.guide_hourly_rate !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Rate</span>
                    <span className="font-semibold text-sm">
                      {profile.guide_hourly_rate === 0 ? 'Free / Negotiable' : `$${profile.guide_hourly_rate}/hr`}
                    </span>
                  </div>
                )}
                {profile.guide_has_vehicle && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Transport</span>
                    <span className="text-sm">🚗 {profile.guide_vehicle_info || 'Has vehicle'}</span>
                  </div>
                )}
                {profile.guide_has_accommodation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Accommodation</span>
                    <span className="text-sm">🏠 {profile.guide_accommodation_info || 'Available'}</span>
                  </div>
                )}
                {profile.guide_regions && profile.guide_regions.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm block mb-1.5">Regions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.guide_regions as string[]).map((r: string) => {
                        const country = getCountryByCode(r)
                        return (
                          <span key={r} className="text-xs bg-white border border-yellow-200 rounded-full px-2.5 py-1">
                            {country ? `${country.emoji} ${country.name}` : r}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
                {profile.spoken_languages && (profile.spoken_languages as LanguageSkill[]).length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm block mb-1.5">Languages</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.spoken_languages as LanguageSkill[]).map((sl: LanguageSkill) => {
                        const lang = getLanguageByCode(sl.lang)
                        const lvl = getLangLevel(sl.level)
                        return (
                          <span key={sl.lang} className="flex items-center gap-1 text-xs bg-white border border-yellow-200 rounded-full px-2.5 py-1">
                            {lang?.emoji || '🗣️'} {lang?.name || sl.lang}
                            <span className="text-yellow-500 ml-0.5">{lvl?.stars || ''}</span>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* 가이드 활동 세부 지역 */}
                {profile.guide_city_regions && (profile.guide_city_regions as GuideRegion[]).length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-600 text-sm block mb-2">🗺️ Guide Areas</span>
                    <div className="space-y-2">
                      {(profile.guide_city_regions as GuideRegion[]).map(region => {
                        const country = getCountryByCode(region.country)
                        return (
                          <div key={region.country} className="bg-white rounded-xl border border-yellow-100 p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span>{country?.emoji}</span>
                              <span className="font-semibold text-sm text-gray-800">{country?.name || region.country}</span>
                            </div>
                            {region.cities.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {region.cities.map(city => (
                                  <span key={city} className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                                    📍 {city}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">전국 지역 가능</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spoken Languages (non-guide users) */}
          {!profile.is_guide && profile.spoken_languages && (profile.spoken_languages as LanguageSkill[]).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">🗣️ Languages</h2>
              <div className="flex flex-wrap gap-2">
                {(profile.spoken_languages as LanguageSkill[]).map((sl: LanguageSkill) => {
                  const lang = getLanguageByCode(sl.lang)
                  const lvl = getLangLevel(sl.level)
                  return (
                    <div key={sl.lang} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                      <span className="text-lg">{lang?.emoji || '🌐'}</span>
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{lang?.name || sl.lang}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-yellow-500">{lvl?.stars || '★'}</span>
                          <span className="text-xs text-gray-500">{lvl?.label || sl.level}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Visited Countries */}
          {visitedCountries && visitedCountries.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">
                🌍 Visited Countries ({visitedCountries.length})
              </h2>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {visitedCountries.map(vc => {
                  const country = getCountryByCode(vc.country_code)
                  return (
                    <span
                      key={vc.country_code}
                      className="text-sm bg-blue-50 text-blue-700 rounded-full px-3 py-1"
                    >
                      {country?.emoji || '🏳'} {vc.country_name || country?.name || vc.country_code}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Social Links */}
          {socialLinks.some(s => profile[s.key as keyof typeof profile]) && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">🔗 Social</h2>
              <div className="space-y-3">
                {socialLinks.map(s => {
                  const val = profile[s.key as keyof typeof profile] as string | null
                  if (!val) return null
                  return (
                    <a
                      key={s.key}
                      href={val.startsWith('http') ? val : `https://${val}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="truncate">{val}</span>
                    </a>
                  )
                })}
                {profile.whatsapp && (
                  <a
                    href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-green-600 hover:text-green-700 hover:underline"
                  >
                    <span className="text-lg">💬</span>
                    <span>WhatsApp: {profile.whatsapp}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Companion Posts */}
        {companionPosts && companionPosts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">✈️ Trip Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {companionPosts.map(post => {
                const country = getCountryByCode(post.destination_country)
                const statusColor = post.status === 'open'
                  ? 'bg-green-100 text-green-700'
                  : post.status === 'closed'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-blue-100 text-blue-700'
                return (
                  <Link
                    key={post.id}
                    href={`/${locale}/companions/${post.id}`}
                    className="block border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">{post.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {country?.emoji} {country?.name || post.destination_country}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(post.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' ~ '}
                      {new Date(post.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div id="reviews" className="space-y-4">
          {/* Reviews header + avg */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              Reviews
              {reviewList.length > 0 && (
                <span className="text-base font-normal text-gray-500 ml-1">
                  ({reviewList.length}) · {avgRating} avg
                </span>
              )}
            </h2>
          </div>

          {/* 별점 분포 (리뷰 있을 때) */}
          {reviewList.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                {locale.startsWith('ko') ? '별점 분포' : 'Rating breakdown'}
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewList.filter((r) => r.rating === star).length
                  const pct = Math.round((count / reviewList.length) * 100)
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">{star} ★</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Review Write Form */}
          {currentUser && !isOwnProfile && !alreadyReviewed && (
            <ReviewForm
              revieweeId={id}
              revieweeName={profile.full_name || profile.username || 'this user'}
              locale={locale}
            />
          )}
          {currentUser && !isOwnProfile && alreadyReviewed && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 flex items-center justify-between gap-3">
              <span>✅ You have already reviewed this user.</span>
              <span className="text-xs text-green-600">You can edit or delete your review below.</span>
            </div>
          )}

          {/* Review List */}
          {reviewList.length > 0 ? (
            <div className="space-y-3">
              {reviewList.map(review => {
                const rawProfiles = review.profiles as { full_name: string | null; avatar_url: string | null; travel_level: number } | { full_name: string | null; avatar_url: string | null; travel_level: number }[] | null
                const reviewer = Array.isArray(rawProfiles) ? rawProfiles[0] ?? null : rawProfiles
                const levelInfo = getLevelInfo(reviewer?.travel_level || 1)
                return (
                  <div key={review.id} className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-start gap-3">
                      <Link href={`/${locale}/users/${review.reviewer_id}`}>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0 hover:opacity-80">
                          {reviewer?.avatar_url ? (
                            <img src={reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : '👤'}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/${locale}/users/${review.reviewer_id}`}>
                            <span className="font-semibold text-sm text-gray-900 hover:text-blue-600">
                              {reviewer?.full_name || 'Anonymous'}
                            </span>
                          </Link>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: levelInfo.color }}
                          >
                            {levelInfo.badge} Lv.{levelInfo.level}
                          </span>
                          <span className="text-yellow-400 text-sm">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </span>
                          <span suppressHydrationWarning className="text-xs text-gray-400 ml-auto">
                            {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Tags */}
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(review.tags as string[]).map((tag: string) => (
                              <span key={tag} className="text-xs bg-blue-50 text-blue-600 rounded-full px-2.5 py-0.5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Content */}
                        {review.content && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.content}</p>
                        )}

                        {/* 내가 쓴 리뷰: 수정/삭제 버튼 */}
                        {currentUser?.id === review.reviewer_id && (
                          <ReviewActions
                            reviewId={review.id}
                            initialRating={review.rating}
                            initialContent={review.content}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No reviews yet.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
