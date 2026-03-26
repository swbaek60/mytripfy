import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { getLevelInfo, getCountryByCode } from '@/data/countries'
import { Button } from '@/components/ui/button'
import ProfileCompleteness from '@/components/ProfileCompleteness'
import { MessageSquare } from 'lucide-react'
import { getLanguageByCode, getLevelInfo as getLangLevel, type LanguageSkill } from '@/data/languages'
import type { GuideRegion } from '@/data/cities'
import { getTranslations } from 'next-intl/server'
import UserChallengeAchievements from '@/components/UserChallengeAchievements'
import SponsorVisitList from '@/components/SponsorVisitList'
import { getPersonalityDisplay } from '@/data/personalityTypes'
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // 로그인 확인
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 방문 국가: 수동 추가 + 100 Countries 인증
  const { data: visitedCountries } = await supabase
    .from('visited_countries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 100 Countries 챌린지 인증으로 얻은 국가 코드
  const { data: certCountries } = await supabase
    .from('challenge_certifications')
    .select('challenge_id')
    .eq('user_id', user.id)
  const certChallengeIds = (certCountries || []).map(c => c.challenge_id)
  const { data: certChallenges } = certChallengeIds.length > 0
    ? await supabase.from('challenges').select('id, country_code').eq('category', 'countries').in('id', certChallengeIds)
    : { data: [] }
  const certifiedCountryCodes = new Set((certChallenges || []).map(c => c.country_code).filter(Boolean) as string[])

  // 가고 싶은 국가 (challenge_wishes + 100 Countries)
  const { data: wishRows } = await supabase
    .from('challenge_wishes')
    .select('challenge_id')
    .eq('user_id', user.id)
  const wishChallengeIds = (wishRows || []).map(w => w.challenge_id)
  const { data: wishChallenges } = wishChallengeIds.length > 0
    ? await supabase.from('challenges').select('id, country_code').eq('category', 'countries').in('id', wishChallengeIds)
    : { data: [] }
  const wishedCountryCodes = (wishChallenges || []).map(c => c.country_code).filter(Boolean) as string[]

  const t = await getTranslations({ locale, namespace: 'Profile' })
  const levelInfo = getLevelInfo(profile?.travel_level || 1)
  const visitedCodes = visitedCountries?.map(v => v.country_code) || []
  const countryCount = new Set([...visitedCodes, ...certifiedCountryCodes]).size

  // 챌린지 완료 수 및 인증 목록 (자랑용 그리드)
  const { data: challengeRows } = await supabase
    .from('challenge_certifications')
    .select('challenge_id')
    .eq('user_id', user.id)
  const challengesCompleted = challengeRows?.length ?? 0

  const { data: myCertifications } = await supabase
    .from('challenge_certifications')
    .select('id, challenge_id, image_url, created_at, challenges(id, title_en, title_ko, category, image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { count: myReviewsCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewer_id', user.id)

  const [
    { count: myCompanionPostsCount },
    { count: myGuideRequestsCount },
  ] = await Promise.all([
    supabase.from('companion_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('guide_requests').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])
  const myPostsTotal = (myCompanionPostsCount ?? 0) + (myGuideRequestsCount ?? 0)

  const certificationList = (myCertifications ?? []) as unknown as Array<{
    id: string
    challenge_id: string
    image_url: string | null
    created_at: string
    challenges: { id: string; title_en: string; title_ko: string | null; category: string; image_url: string | null } | null
  }>

  // 명예의 전당과 동일: 경험·기여 점수
  const [
    { data: expRow },
    { data: contribRow },
  ] = await Promise.all([
    supabase.from('hall_of_fame_leaderboard').select('challenge_points').eq('id', user.id).maybeSingle(),
    supabase.from('contribution_leaderboard').select('contribution_points').eq('id', user.id).maybeSingle(),
  ])
  const experiencePoints = (expRow as { challenge_points?: number } | null)?.challenge_points ?? profile?.challenge_points ?? 0
  const contributionPoints = (contribRow as { contribution_points?: number } | null)?.contribution_points ?? 0

  const { data: mySponsorVisits } = await supabase
    .from('sponsor_visits')
    .select('id, sponsor_id, photo_url, points_granted, created_at, sponsors(id, name, name_en, country_code, city)')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  type SponsorInfoProfile = { id: string; name: string | null; name_en: string | null; country_code: string | null; city: string | null }
  const rawSponsorVisits = (mySponsorVisits ?? []) as Array<{ id: string; sponsor_id: string; photo_url: string; points_granted: number; created_at: string; sponsors: SponsorInfoProfile | SponsorInfoProfile[] | null }>
  const myVisitList = rawSponsorVisits.map(row => ({
    ...row,
    sponsors: Array.isArray(row.sponsors) ? row.sponsors[0] ?? null : row.sponsors,
  }))

  const { data: travelPersonality } = await supabase
    .from('travel_personalities')
    .select('personality_type, personality_desc, scores')
    .eq('id', user.id)
    .maybeSingle()

  const MILESTONES = [
    { at: 10,   emoji: '🌱', label: 'Starter',  color: '#22c55e' },
    { at: 100,  emoji: '🥉', label: 'Bronze',   color: '#b45309' },
    { at: 300,  emoji: '🥈', label: 'Silver',   color: '#6b7280' },
    { at: 600,  emoji: '🥇', label: 'Gold',     color: '#d97706' },
    { at: 1000, emoji: '💎', label: 'Diamond',  color: '#06b6d4' },
    { at: 1600, emoji: '👑', label: 'Legend',   color: '#7c3aed' },
  ]
  const challengeBadge = [...MILESTONES].reverse().find(m => challengesCompleted >= m.at)
    ?? { emoji: '🌍', label: 'Explorer', color: '#9333ea' }

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── 빠른 편집 배너 (최상단) ── */}
        <Link href={`/${locale}/profile/edit`}>
          <div className="bg-surface rounded-2xl shadow-sm border border-edge px-5 py-4 mb-4 flex items-center justify-between hover:shadow-md hover:border-edge-brand transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-edge bg-surface-sunken flex items-center justify-center text-xl overflow-hidden shrink-0">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-hint">👤</span>}
              </div>
              <div>
                <p className="font-bold text-heading">{profile?.full_name || t('namePlaceholder')}</p>
                <p className="text-xs text-hint">{t('quickEditSubtitle')}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-brand bg-brand-light px-4 py-2 rounded-xl group-hover:bg-brand group-hover:text-white transition-colors">
              {t('editBtn')} →
            </span>
          </div>
        </Link>

        {/* 프로필 완성도 */}
        <div className="mb-6">
          <ProfileCompleteness
            locale={locale}
            emailVerified={!!(profile?.email_verified)}
            profile={{
              full_name: profile?.full_name,
              bio: profile?.bio,
              avatar_url: profile?.avatar_url,
              nationality: profile?.nationality,
              birth_year: profile?.birth_year as number | null,
              instagram_url: profile?.instagram_url,
              facebook_url: profile?.facebook_url,
              twitter_url: profile?.twitter_url,
              whatsapp: profile?.whatsapp,
              telegram: profile?.telegram,
              line_id: profile?.line_id,
              profile_photos: profile?.profile_photos as string[] | null,
              spoken_languages: profile?.spoken_languages as unknown[] | null,
              travel_count: countryCount,
              is_guide: profile?.is_guide,
              guide_city_regions: profile?.guide_city_regions as unknown[] | null,
            }}
          />
        </div>

        {/* 프로필 카드 */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-brand-muted flex items-center justify-center text-3xl shadow-md overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  : '👤'}
              </div>
              <Link href={`/${locale}/profile/edit`}>
                <Button variant="outline" className="rounded-full text-sm border-brand text-brand hover:bg-brand-light">
                  {t('editBtn')}
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-heading">
                {profile?.full_name || t('namePlaceholder')}
              </h1>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: levelInfo.color }}>
                {levelInfo.badge} Lv.{levelInfo.level} {levelInfo.titleKo}
              </span>
            </div>

            <p className="text-subtle text-sm mb-3">{user.email}</p>

            {/* 인증 뱃지 */}
            <div className="flex gap-2 flex-wrap mb-4">
              {profile?.email_verified && (
                <span className="px-2 py-1 bg-success-light text-success text-xs rounded-full border border-green-200">✅ {t('emailVerified')}</span>
              )}
              {profile?.phone_verified && (
                <span className="px-2 py-1 bg-brand-light text-brand-hover text-xs rounded-full border border-edge-brand">📱 {t('phoneVerified')}</span>
              )}
              {profile?.sns_verified && (
                <span className="px-2 py-1 bg-purple-light text-purple-700 text-xs rounded-full border border-purple-200">🔗 {t('snsVerified')}</span>
              )}
              {!profile?.email_verified && !profile?.phone_verified && !profile?.sns_verified && (
                <span className="px-2 py-1 bg-surface-sunken text-subtle text-xs rounded-full border border-edge">{t('earnBadge')}</span>
              )}
            </div>

            {/* 자기소개 */}
            {profile?.bio ? (
              <p className="text-body text-sm leading-relaxed bg-surface-sunken rounded-xl p-4 mb-4">{profile.bio}</p>
            ) : (
              <div className="bg-surface-sunken rounded-xl p-4 mb-4 text-center">
                <p className="text-hint text-sm">{t('bioPlaceholder')}</p>
                <Link href={`/${locale}/profile/edit`}>
                  <Button variant="link" className="text-brand text-sm p-0 h-auto">+ {t('addBio')}</Button>
                </Link>
              </div>
            )}

            {/* 통계 */}
            <div className="grid grid-cols-4 gap-4 py-4 border-t border-edge">
              <Link href={`/${locale}/challenges/countries`}
                className="text-center hover:bg-brand-light rounded-lg p-1 transition-colors">
                <div className="text-2xl font-bold text-brand">{countryCount}</div>
                <div className="text-xs text-subtle mt-1">{t('visitedCountriesLabel')}</div>
              </Link>
              <Link href={`/${locale}/challenges`}
                className="text-center border-l border-edge hover:bg-purple-light rounded-lg p-1 transition-colors">
                <div className="text-2xl font-bold text-purple flex items-center justify-center gap-1">
                  <span>{challengeBadge.emoji}</span>
                  <span>{challengesCompleted}</span>
                </div>
                <div className="text-xs text-subtle mt-1">{t('challenges')}</div>
              </Link>
              <Link
                href={`/${locale}/users/${user.id}#reviews`}
                className="text-center border-l border-edge hover:bg-warning-light rounded-lg p-1 transition-colors"
              >
                <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                  <span>{profile?.trust_score ? Number(profile.trust_score).toFixed(1) : '-'}</span>
                  <span className="text-yellow-400">★</span>
                </div>
                <div className="text-xs text-subtle mt-1">
                  {profile?.review_count || 0} {t('receivedReviews')}
                </div>
              </Link>
              <Link
                href={`/${locale}/dashboard`}
                className="text-center border-l border-edge hover:bg-success-light rounded-lg p-1 transition-colors"
              >
                <div className="text-2xl font-bold text-success">{myPostsTotal}</div>
                <div className="text-xs text-subtle mt-1">{t('myPostsLabel')}</div>
              </Link>
            </div>

            {/* 내가 리뷰한 사람들 링크 */}
            <Link
              href={`/${locale}/reviews/mine`}
              className="flex items-center justify-center gap-2 py-2 mt-2 text-sm font-medium text-purple hover:text-purple-700 hover:bg-purple-light rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {t('reviewsIWrote')} ({myReviewsCount ?? 0})
            </Link>

            {/* SNS 링크 */}
            {(profile?.instagram_url || profile?.facebook_url || profile?.twitter_url || profile?.whatsapp) && (
              <div className="flex gap-3 flex-wrap pt-4 border-t border-edge">
                {profile?.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-pink-600 hover:underline">
                    📸 Instagram
                  </a>
                )}
                {profile?.facebook_url && (
                  <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-brand-hover hover:underline">
                    👤 Facebook
                  </a>
                )}
                {profile?.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-sky-500 hover:underline">
                    🐦 X (Twitter)
                  </a>
                )}
                {profile?.whatsapp && (
                  <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-success hover:underline">
                    💬 WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Travel Personality */}
        <div className="bg-surface rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-heading">🧠 {t('travelPersonalityTitle')}</h2>
            <Link href={`/${locale}/personality`}>
              <Button size="sm" className="rounded-full bg-brand hover:bg-brand-hover text-white">
                {travelPersonality?.personality_type ? t('travelPersonalityEdit') : t('travelPersonalityTakeTest')} →
              </Button>
            </Link>
          </div>
          {travelPersonality?.personality_type ? (
            (() => {
              const p = getPersonalityDisplay(travelPersonality.personality_type)
              if (!p) return null
              const desc = travelPersonality.personality_desc || p.desc
              const scores = (travelPersonality.scores as Record<string, string> | null) ?? {}
              const hasScores = Object.keys(scores).length > 0
              return (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-surface-sunken rounded-xl border border-edge">
                    <span className="text-4xl shrink-0">{p.emoji}</span>
                    <div>
                      <p className="font-bold text-heading text-lg" style={{ color: p.color }}>{p.type}</p>
                      {desc && <p className="text-body text-sm leading-relaxed mt-1">{desc}</p>}
                    </div>
                  </div>
                  {hasScores && (
                    <div className="bg-surface-sunken rounded-xl p-4 border border-edge">
                      <p className="font-semibold text-body text-sm mb-3">{t('travelPersonalityDna')}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {Object.entries(scores).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-subtle capitalize">{key}</span>
                            <span className="font-medium text-body capitalize">{String(val).replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()
          ) : (
            <p className="text-subtle text-sm py-2">{t('travelPersonalityEmpty')}</p>
          )}
        </div>

        {/* 챌린지 배지 */}
        <div className="bg-surface rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-heading">🏆 World 100 Challenges</h2>
              <p className="text-sm text-subtle mt-0.5">
                <span className="font-bold text-purple">{t('challengesDone', { count: challengesCompleted })}</span>
                &nbsp;·&nbsp;
                <span style={{ color: challengeBadge.color }} className="font-bold">
                  {challengeBadge.emoji} {challengeBadge.label}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/${locale}/hall-of-fame`}>
                <Button variant="outline" size="sm" className="rounded-full text-xs border-amber-400 text-amber-700">
                  🏆 {t('hallOfFame')}
                </Button>
              </Link>
              <Link href={`/${locale}/challenges`}>
                <Button variant="outline" size="sm" className="rounded-full text-xs border-purple-500 text-purple">
                  {t('challengeCta')} →
                </Button>
              </Link>
            </div>
          </div>
          <div className="w-full bg-surface-sunken rounded-full h-2.5 mb-3">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((challengesCompleted / 1600) * 100))}%` }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {MILESTONES.map(m => (
              <span key={m.at}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  challengesCompleted >= m.at
                    ? 'bg-purple-light border-purple-200 text-purple-700'
                    : 'bg-surface-sunken border-edge text-hint'
                }`}>
                {m.emoji} {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* 내 챌린지 인증 그리드 (자랑 공간) */}
        <UserChallengeAchievements
          userId={user.id}
          certifications={certificationList}
          challengePoints={profile?.challenge_points ?? 0}
          experiencePoints={experiencePoints}
          contributionPoints={contributionPoints}
          locale={locale}
        />

        {/* 내 스폰서 매장 방문 인증 */}
        <SponsorVisitList
          visits={myVisitList}
          locale={locale}
          isOwnProfile
        />

        {/* 사용 가능한 언어 */}
        {profile?.spoken_languages && (profile.spoken_languages as LanguageSkill[]).length > 0 && (
          <div className="bg-surface rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-heading">{t('languagesTitle')}</h2>
              <Link href={`/${locale}/profile/edit`}>
                <Button variant="ghost" size="sm" className="text-xs text-brand hover:bg-brand-light rounded-full">{t('editShort')}</Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {(profile.spoken_languages as LanguageSkill[]).map(sl => {
                const lang = getLanguageByCode(sl.lang)
                const lvl = getLangLevel(sl.level)
                return (
                  <div key={sl.lang} className="flex items-center gap-2 bg-brand-light border border-edge-brand rounded-xl px-3 py-2">
                    <span className="text-lg">{lang?.emoji || '🌐'}</span>
                    <div>
                      <span className="font-semibold text-sm text-heading">{lang?.name || sl.lang}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-yellow-500">{lvl?.stars || '★'}</span>
                        <span className="text-xs text-subtle">{lvl?.label || sl.level}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 방문·인증한 국가 + 가고 싶은 국가 */}
        {(visitedCodes.length > 0 || certifiedCountryCodes.size > 0 || wishedCountryCodes.length > 0) && (
          <div className="bg-surface rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-heading">{t('visitedSectionTitle')}</h2>
              <Link href={`/${locale}/challenges/countries`}>
                <Button variant="ghost" size="sm" className="text-xs text-brand hover:bg-brand-light rounded-full">100 Countries →</Button>
              </Link>
            </div>
            {(visitedCodes.length > 0 || certifiedCountryCodes.size > 0) && (
              <div className="mb-4">
                <p className="text-xs font-medium text-subtle mb-2">
                  {t('visitedCertified', { count: new Set([...visitedCodes, ...certifiedCountryCodes]).size })}
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {[...new Set([...visitedCodes, ...certifiedCountryCodes])].map(code => {
                    const country = getCountryByCode(code)
                    return (
                      <span key={code} className="text-sm bg-brand-light text-brand-hover rounded-full px-3 py-1.5 border border-edge-brand">
                        {country?.emoji || '🏳'} {country?.name || '–'}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {wishedCountryCodes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-subtle mb-2">
                  {t('visitedWishlist', { count: wishedCountryCodes.length })}
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {wishedCountryCodes.map(code => {
                    const country = getCountryByCode(code)
                    return (
                      <span key={code} className="text-sm bg-amber-light text-amber-700 rounded-full px-3 py-1.5 border border-amber-200">
                        {country?.emoji || '🏳'} {country?.name || '–'}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 가이드 정보 */}
        {profile?.is_guide && (
          <div className="bg-surface rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-heading">{t('guideInfoSectionTitle')}</h2>
              <Link href={`/${locale}/profile/edit`}>
                <Button variant="ghost" size="sm" className="text-xs text-brand hover:bg-brand-light rounded-full">{t('editShort')}</Button>
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-subtle text-sm w-28">{t('hourlyRate')}</span>
                <span className="font-semibold text-brand">
                  {profile.guide_hourly_rate ? `$${profile.guide_hourly_rate} USD` : t('free')}
                </span>
              </div>
              {profile.guide_has_vehicle && (
                <div className="flex items-center gap-2">
                  <span className="text-subtle text-sm w-28">{t('vehicleService')}</span>
                  <span className="font-semibold text-success">✅ {t('included')}</span>
                  {profile.guide_vehicle_info && <span className="text-sm text-body">({profile.guide_vehicle_info})</span>}
                </div>
              )}
              {profile.guide_has_accommodation && (
                <div className="flex items-center gap-2">
                  <span className="text-subtle text-sm w-28">{t('accommodationService')}</span>
                  <span className="font-semibold text-success">✅ {t('included')}</span>
                </div>
              )}
              {profile.guide_city_regions && (profile.guide_city_regions as GuideRegion[]).length > 0 && (
                <div>
                  <span className="text-subtle text-sm block mb-2">{t('activeRegion')}</span>
                  <div className="space-y-2">
                    {(profile.guide_city_regions as GuideRegion[]).map(region => {
                      const c = getCountryByCode(region.country)
                      return (
                        <div key={region.country} className="bg-amber-light rounded-xl border border-amber-100 p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span>{c?.emoji}</span>
                            <span className="font-semibold text-sm text-heading">{c?.name || region.country}</span>
                          </div>
                          {region.cities.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {region.cities.map(city => (
                                <span key={city} className="text-xs bg-surface border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                  {city}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-hint">{t('nationwide')}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {(!profile.guide_city_regions || (profile.guide_city_regions as GuideRegion[]).length === 0) &&
               (profile.guide_regions as string[] | null)?.length && (
                <div>
                  <span className="text-subtle text-sm block mb-1.5">{t('activeRegion')}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.guide_regions as string[]).map(r => {
                      const c = getCountryByCode(r)
                      return (
                        <span key={r} className="text-xs bg-warning-light border border-yellow-200 rounded-full px-2.5 py-1">
                          {c ? `${c.emoji} ${c.name}` : '🏳 Unknown'}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

