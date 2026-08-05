import { createClient, getAuthUser } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getLevelInfo, getCountryByCode } from '@/data/countries'
import CountryFlag from '@/components/CountryFlag'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { type LanguageSkill } from '@/data/languages'
import type { GuideRegion } from '@/data/cities'
import GuideContactModal from './GuideContactModal'
import GuideDetailTabs from './GuideDetailTabs'
import type { CertificationItem } from './GuideDetailTabs'
import GuideHeroGallery from '@/components/GuideHeroGallery'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd, buildGuidePersonJsonLd } from '@/lib/seo/json-ld'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: guide } = await supabase.from('profiles').select('full_name, bio, avatar_url, guide_regions').eq('id', id).single()
  const tg = await getTranslations({ locale, namespace: 'GuideDetail' })
  const tGuides = await getTranslations({ locale, namespace: 'Guides' })
  if (!guide) return { title: tg('notFoundTitle') }
  const name = (guide.full_name as string | null) || tGuides('anonymousGuide')
  const title = tg('seoTitle', { name })
  const description = (guide.bio as string | null)?.slice(0, 160) || tg('seoDescription', { name })
  const base = buildPageMetadata({
    locale,
    path: `/guides/${id}`,
    title,
    description,
    openGraphType: 'article',
    keywords: [tGuides('title'), tg('seoKeyword')],
  })
  const avatar = guide.avatar_url as string | null
  if (avatar?.startsWith('http')) {
    return {
      ...base,
      openGraph: { ...base.openGraph, images: [{ url: avatar, alt: title }] },
      twitter: { ...base.twitter, images: [avatar] },
    }
  }
  return base
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  const tc = await getTranslations({ locale, namespace: 'Common' })
  const tg = await getTranslations({ locale, namespace: 'GuideDetail' })
  const tb = await getTranslations({ locale, namespace: 'Bookmarks' })
  const tGuides = await getTranslations({ locale, namespace: 'Guides' })
  const tNav = await getTranslations({ locale, namespace: 'Nav' })

  const { data: guide } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('is_guide', true)
    .single()

  if (!guide) notFound()

  const { data: visitedCountriesRaw } = await supabase
    .from('visited_countries')
    .select('country_code')
    .eq('user_id', id)

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, rating, content, tags, created_at, reviewer_id')
    .eq('reviewee_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  // 리뷰어 프로필 별도 조회
  const reviewerIds = (reviewsRaw ?? []).map(r => r.reviewer_id).filter(Boolean)
  const { data: reviewerProfiles } = reviewerIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', reviewerIds)
    : { data: [] }

  const reviewerMap = Object.fromEntries((reviewerProfiles ?? []).map(p => [p.id, p]))
  const reviews = (reviewsRaw ?? []).map(r => ({
    ...r,
    profiles: reviewerMap[r.reviewer_id] ?? null,
  }))

  // 챌린지 인증 목록 (명예의전당용) — country_code, dispute_status 포함
  const { data: certifications } = await supabase
    .from('challenge_certifications')
    .select('id, challenge_id, image_url, created_at, dispute_status, challenges(id, title_en, title_ko, category, image_url, points, country_code)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const challengesCompleted = certifications?.length ?? 0

  // 명예의 전당과 동일: 경험·기여 점수
  const [
    { data: expRow },
    { data: contribRow },
  ] = await Promise.all([
    supabase.from('hall_of_fame_leaderboard').select('challenge_points').eq('id', id).maybeSingle(),
    supabase.from('contribution_leaderboard').select('contribution_points').eq('id', id).maybeSingle(),
  ])
  const experiencePoints = (expRow as { challenge_points?: number } | null)?.challenge_points ?? guide?.challenge_points ?? 0
  const contributionPoints = (contribRow as { contribution_points?: number } | null)?.contribution_points ?? 0

  // 스폰서 매장 방문 인증 (approved)
  const { data: sponsorVisits } = await supabase
    .from('sponsor_visits')
    .select('id, sponsor_id, photo_url, points_granted, created_at, sponsors(id, name, name_en, country_code, city)')
    .eq('user_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  type SponsorInfo = { id: string; name: string | null; name_en: string | null; country_code: string | null; city: string | null }
  type SponsorVisitRow = {
    id: string
    sponsor_id: string
    photo_url: string
    points_granted: number
    created_at: string
    sponsors: SponsorInfo | null
  }
  const rawVisits = (sponsorVisits ?? []) as Array<{ id: string; sponsor_id: string; photo_url: string; points_granted: number; created_at: string; sponsors: SponsorInfo | SponsorInfo[] | null }>
  const sponsorVisitList: SponsorVisitRow[] = rawVisits.map(row => ({
    ...row,
    sponsors: Array.isArray(row.sponsors) ? row.sponsors[0] ?? null : row.sponsors,
  }))

  let myDisputedVisitIds = new Set<string>()
  let myCertCount = 0
  let myDisputedCertKeys = new Set<string>()
  if (user && user.id !== id) {
    const [disputedVisitsRes, certCountRes, disputesRes] = await Promise.all([
      sponsorVisitList.length > 0
        ? supabase.from('sponsor_visit_disputes').select('visit_id').eq('reporter_id', user.id).in('visit_id', sponsorVisitList.map(v => v.id))
        : Promise.resolve({ data: [] }),
      supabase.from('challenge_certifications').select('challenge_id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('challenge_disputes').select('cert_challenge_id').eq('reporter_id', user.id).eq('cert_user_id', id),
    ])
    myDisputedVisitIds = new Set((disputedVisitsRes?.data ?? []).map((d: { visit_id: string }) => d.visit_id))
    myCertCount = certCountRes?.count ?? 0
    myDisputedCertKeys = new Set((disputesRes?.data ?? []).map((d: { cert_challenge_id: string }) => `${id}_${d.cert_challenge_id}`))
  }

  // 방문 국가: visited_countries + 챌린지 'countries' 카테고리 인증 통합
  const visitedSet = new Set((visitedCountriesRaw ?? []).map(r => r.country_code))
  const certCountryCodes = (certifications ?? [])
    .filter(c => (c.challenges as { category?: string; country_code?: string } | null)?.category === 'countries')
    .map(c => (c.challenges as { country_code?: string } | null)?.country_code)
    .filter((code): code is string => !!code)
  certCountryCodes.forEach(code => visitedSet.add(code))
  const visitedCountries = [...visitedSet].map(code => ({ country_code: code }))

  const levelInfo = getLevelInfo(guide.travel_level || 1)
  const nationalityCode = typeof guide.nationality === 'string' ? guide.nationality.trim().toUpperCase() : ''
  const nationalityCountry = nationalityCode.length === 2 ? getCountryByCode(nationalityCode) : null
  const isOwn = user?.id === id

  const guideName = guide.full_name || tb('anonymousGuide')
  const ratingSum = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0)
  const guideRegionNames = ((guide.guide_city_regions as GuideRegion[] | null) ?? [])
    .map(region => getCountryByCode(region.country)?.name ?? region.country)
  const guideLanguages = ((guide.spoken_languages as LanguageSkill[] | null) ?? [])
    .map(skill => skill.lang)

  return (
    <div className="min-h-screen bg-surface-sunken">
      <JsonLdScript
        data={buildGuidePersonJsonLd({
          locale,
          guideId: id,
          name: guideName,
          description: guide.bio,
          image: typeof guide.avatar_url === 'string' ? guide.avatar_url : null,
          areaServed: guideRegionNames,
          languages: guideLanguages,
          reviewCount: reviews.length,
          ratingValue: reviews.length > 0 ? Number((ratingSum / reviews.length).toFixed(1)) : undefined,
        })}
      />
      <JsonLdScript
        data={buildBreadcrumbJsonLd(locale, [
          { name: tNav('findGuides'), path: '/guides' },
          { name: guideName, path: `/guides/${id}` },
        ])}
      />
      <Header locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link href={`/${locale}/guides`} className="text-sm text-subtle hover:text-brand flex items-center gap-1">
          ← {tGuides('backToGuides')}
        </Link>

        {/* ── 히어로 갤러리 ── */}
        <GuideHeroGallery
          avatar={guide.avatar_url as string | null}
          photos={(guide.profile_photos as string[] | null) ?? []}
          name={guideName}
        />

        {/* ── 프로필 카드 ── */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-5">
            {/* 레벨 + 편집 버튼 행 */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: levelInfo.color }}
              >
                {levelInfo.badge} {levelInfo.titleKo}
              </span>
              {isOwn && (
                <Link href={`/${locale}/profile/edit`}>
                  <Button variant="outline" size="sm" className="rounded-full text-sm">✏️ {tc('editProfile')}</Button>
                </Link>
              )}
            </div>

            {/* 이름 */}
            <h1 className="text-2xl font-bold text-heading mb-1">{guide.full_name || tb('anonymousGuide')}</h1>

            {/* 국적 */}
            {nationalityCode.length === 2 && (
              <p className="text-subtle text-sm mb-2 flex items-center gap-2">
                <CountryFlag code={nationalityCode} size="sm" className="shrink-0" />
                <span>{nationalityCountry ? nationalityCountry.name : ''}</span>
              </p>
            )}

            {/* 인증 배지 */}
            {(guide.email_verified || guide.phone_verified || guide.sns_verified) && (
              <div className="flex gap-2 flex-wrap mb-3">
                {guide.email_verified && <span className="px-2 py-0.5 bg-success-light text-success-strong text-xs rounded-full border border-success-border">✅ {tg('emailVerified')}</span>}
                {guide.phone_verified && <span className="px-2 py-0.5 bg-brand-light text-brand-hover text-xs rounded-full border border-edge-brand">📱 {tg('phoneVerified')}</span>}
                {guide.sns_verified && <span className="px-2 py-0.5 bg-purple-light text-purple-strong text-xs rounded-full border border-purple/20">🔗 {tg('snsVerified')}</span>}
              </div>
            )}

            {/* 연락 버튼 */}
            {!isOwn && (
              <div className="mt-3">
                <GuideContactModal
                  locale={locale}
                  guideId={id}
                  guideName={guideName}
                  whatsapp={guide.whatsapp as string | null}
                  telegram={guide.telegram as string | null}
                  lineId={guide.line_id as string | null}
                  instagram={guide.instagram_url as string | null}
                  facebook={guide.facebook_url as string | null}
                  twitter={guide.twitter_url as string | null}
                  isLoggedIn={!!user}
                />
              </div>
            )}
          </div>
        </div>

        {/* 탭 섹션: Overview / Countries / Reviews */}
        <GuideDetailTabs
          guideId={id}
          locale={locale}
          bio={guide.bio as string | null}
          travelCount={guide.travel_count || 0}
          trustScore={guide.trust_score ?? null}
          reviewCount={guide.review_count || 0}
          memberSince={guide.created_at as string | null}
          challengesCompleted={challengesCompleted}
          challengePoints={guide.challenge_points as number ?? 0}
          experiencePoints={experiencePoints}
          contributionPoints={contributionPoints}
          certifications={(certifications ?? []) as unknown as CertificationItem[]}
          sponsorVisitList={sponsorVisitList}
          currentUserId={user?.id ?? null}
          myCertCount={myCertCount}
          myDisputedVisitIds={[...myDisputedVisitIds]}
          disputedKeys={[...myDisputedCertKeys]}
          profilePhotos={(guide.profile_photos as string[] | null) ?? []}
          guideRate={guide.guide_hourly_rate as number | null}
          rateCurrency={guide.rate_currency as string | null}
          hasVehicle={!!guide.guide_has_vehicle}
          vehicleInfo={guide.guide_vehicle_info as string | null}
          vehiclePhotos={(guide.guide_vehicle_photos as string[] | null) ?? []}
          hasAccommodation={!!guide.guide_has_accommodation}
          accommodationInfo={guide.guide_accommodation_info as string | null}
          accommodationPhotos={(guide.guide_accommodation_photos as string[] | null) ?? []}
          guideRegions={(guide.guide_city_regions as GuideRegion[] | null) ?? []}
          guideRegionsLegacy={(guide.guide_regions as string[] | null) ?? []}
          spokenLanguages={(guide.spoken_languages as LanguageSkill[] | null) ?? []}
          visitedCountries={visitedCountries}
          reviews={reviews}
        />
      </main>
    </div>
  )
}
