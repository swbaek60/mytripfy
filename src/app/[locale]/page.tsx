import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { createAdminClient } from '@/utils/supabase/server'
import HomeAuthLink from '@/components/marketing/HomeAuthLink'
import HomeFinalCta from '@/components/marketing/HomeFinalCta'
import HeroSearch from '@/components/marketing/HeroSearch'
import SectionShell from '@/components/layout/SectionShell'
import ValuePropGrid from '@/components/marketing/ValuePropGrid'
import DestinationCarousel from '@/components/marketing/DestinationCarousel'
import ChallengeSpotlight from '@/components/marketing/ChallengeSpotlight'
import ChallengeCategoriesGrid from '@/components/marketing/ChallengeCategoriesGrid'
import TrustStack, { TRUST_ICONS } from '@/components/marketing/TrustStack'
import TestimonialTabs from '@/components/marketing/TestimonialTabs'
import FaqAccordion from '@/components/marketing/FaqAccordion'
import PromoBanner from '@/components/layout/PromoBanner'
import CompanionStoryCard from '@/components/explore/CompanionStoryCard'
import GuideRateDisplay from '@/components/GuideRateDisplay'
import GuidePhotoCarousel from '@/components/GuidePhotoCarousel'
import CountryFlag from '@/components/CountryFlag'
import Avatar from '@/components/ui/Avatar'
import { getLevelInfo, getCountryByCode } from '@/data/countries'
import type { GuideRegion } from '@/data/cities'
import { Users, ShieldCheck, Map as MapIcon, Trophy, UserCheck, Search, Star, Award } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildFaqPageJsonLd } from '@/lib/seo/json-ld'
import { TOTAL_CHALLENGES } from '@/data/challengeTotals'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Seo' })
  const keywords = t('keywords').split(',').map(k => k.trim()).filter(Boolean)
  return buildPageMetadata({
    locale,
    path: '',
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    keywords,
  })
}

export const revalidate = 120

const POPULAR_FALLBACK = ['JP', 'TH', 'IT', 'FR', 'US', 'AU', 'ES', 'VN']

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  const tNav = await getTranslations({ locale, namespace: 'Nav' })
  const tChallenges = await getTranslations({ locale, namespace: 'Challenges' })

  type PostRow = {
    id: string
    title: string
    destination_country: string
    destination_city?: string | null
    start_date: string
    end_date: string
    purpose?: string | null
    cover_image?: string | null
    profiles: Record<string, unknown>
  }
  type GuideRow = {
    id: string
    full_name: string | null
    avatar_url: string | null
    nationality?: string | null
    trust_score?: number
    guide_hourly_rate?: number
    rate_currency?: string | null
    travel_level?: number | null
    profile_photos?: string[] | null
    guide_city_regions?: GuideRegion[] | null
  }
  type LeaderboardRow = { id: string; full_name: string | null; avatar_url: string | null; total_points?: number }
  type CertRow = {
    user_id: string
    challenge_id: string
    image_url: string
    profiles: { full_name: string | null } | null
    challenges: { title_en: string; points: number } | null
  }

  let recentPosts: PostRow[] = []
  let topGuides: GuideRow[] = []
  let hallOfFameTop5: LeaderboardRow[] = []
  let spotlightCerts: CertRow[] = []
  const popularCodes: string[] = []

  try {
    // createClient() 는 Clerk auth() 를 호출해 헤더를 읽으므로 ISR 이 깨진다.
    // 홈은 공개 데이터만 보여주므로 인증 없는 관리자 클라이언트를 쓴다.
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const [
      { data: rp },
      { data: tg },
      { data: hf5 },
      { data: certs },
      { data: ccr },
    ] = await Promise.all([
      supabase
        .from('companion_posts')
        .select('id, title, start_date, end_date, destination_country, destination_city, purpose, cover_image, status, profiles(id, full_name, avatar_url, trust_score)')
        .eq('status', 'open')
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, nationality, trust_score, guide_hourly_rate, rate_currency, travel_level, profile_photos, guide_city_regions')
        .eq('is_guide', true)
        .order('trust_score', { ascending: false })
        .limit(4),
      supabase.from('overall_leaderboard').select('id, full_name, avatar_url, total_points').order('total_points', { ascending: false }).limit(5),
      supabase
        .from('challenge_certifications')
        .select('user_id, challenge_id, image_url, profiles(full_name), challenges(title_en, points)')
        .neq('dispute_status', 'invalidated')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('companion_posts')
        .select('destination_country')
        .eq('status', 'open')
        .gte('end_date', today)
        .not('destination_country', 'is', null),
    ])

    recentPosts = (rp as unknown as PostRow[]) ?? []
    topGuides = (tg as GuideRow[]) ?? []
    hallOfFameTop5 = (hf5 as LeaderboardRow[]) ?? []
    spotlightCerts = (certs as unknown as CertRow[]) ?? []

    const countByCountry = new Map<string, number>()
    for (const row of ccr ?? []) {
      const code = (row as { destination_country: string }).destination_country
      if (code) countByCountry.set(code, (countByCountry.get(code) ?? 0) + 1)
    }
    const sorted = [...countByCountry.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c)
    const used = new Set<string>()
    for (const code of sorted) {
      if (popularCodes.length >= 8) break
      used.add(code)
      popularCodes.push(code)
    }
    for (const code of POPULAR_FALLBACK) {
      if (popularCodes.length >= 8) break
      if (!used.has(code)) popularCodes.push(code)
    }
  } catch (err) {
    console.error('Home page data fetch error:', err)
  }

  const popularDestinations = popularCodes.map(code => ({
    code,
    name: getCountryByCode(code)?.name ?? code,
  }))

  const pillars = [
    { icon: Trophy, title: tm('pillarEarnTitle'), description: tm('pillarEarnDesc'), accent: '#7C3AED' },
    { icon: Users, title: tm('pillarMatchTitle'), description: tm('pillarMatchDesc'), accent: '#2563EB' },
    { icon: ShieldCheck, title: tm('pillarVerifyTitle'), description: tm('pillarVerifyDesc'), accent: '#0D9488' },
    { icon: MapIcon, title: tm('pillarExploreTitle'), description: tm('pillarExploreDesc'), accent: '#D4A853' },
  ]

  const trustItems = [
    { icon: TRUST_ICONS.ShieldCheck, title: tm('trustFreeTitle'), description: tm('trustFreeDesc') },
    { icon: TRUST_ICONS.MessageCircle, title: tm('trustReviewTitle'), description: tm('trustReviewDesc') },
    { icon: TRUST_ICONS.Scale, title: tm('trustDisputeTitle'), description: tm('trustDisputeDesc') },
    { icon: TRUST_ICONS.BadgeCheck, title: tm('trustVerifiedTitle'), description: tm('trustVerifiedDesc') },
  ]

  const testimonials = [
    { name: tm('testimonial1Name'), age: 28, quote: tm('testimonial1Quote'), location: tm('testimonial1Location') },
    { name: tm('testimonial2Name'), age: 34, quote: tm('testimonial2Quote'), location: tm('testimonial2Location') },
    { name: tm('testimonial3Name'), age: 26, quote: tm('testimonial3Quote'), location: tm('testimonial3Location') },
    { name: tm('testimonial4Name'), age: 31, quote: tm('testimonial4Quote'), location: tm('testimonial4Location') },
    { name: tm('testimonial5Name'), age: 24, quote: tm('testimonial5Quote'), location: tm('testimonial5Location') },
  ]

  const faqItems = [
    { question: tm('faq1Q'), answer: tm('faq1A') },
    { question: tm('faq2Q'), answer: tm('faq2A') },
    { question: tm('faq3Q'), answer: tm('faq3A') },
    { question: tm('faq4Q'), answer: tm('faq4A') },
    { question: tm('faq5Q'), answer: tm('faq5A') },
    { question: tm('faq6Q'), answer: tm('faq6A') },
    { question: tm('faq7Q'), answer: tm('faq7A') },
    { question: tm('faq8Q'), answer: tm('faq8A') },
    { question: tm('faq9Q'), answer: tm('faq9A') },
    { question: tm('faq10Q'), answer: tm('faq10A') },
  ]

  const certSpotlight = spotlightCerts.map(c => ({
    user_id: c.user_id,
    challenge_id: c.challenge_id,
    image_url: c.image_url,
    title: c.challenges?.title_en ?? tChallenges('challengeFallback'),
    userName: c.profiles?.full_name ?? tm('traveler'),
    points: c.challenges?.points ?? 0,
  }))

  const challengeCategoryLabels = {
    catCountries: tm('catCountries'),
    catCountriesDesc: tm('catCountriesDesc'),
    catAttractions: tm('catAttractions'),
    catAttractionsDesc: tm('catAttractionsDesc'),
    catFoods: tm('catFoods'),
    catFoodsDesc: tm('catFoodsDesc'),
    catRestaurants: tm('catRestaurants'),
    catRestaurantsDesc: tm('catRestaurantsDesc'),
    catNature: tm('catNature'),
    catNatureDesc: tm('catNatureDesc'),
    catIslands: tm('catIslands'),
    catIslandsDesc: tm('catIslandsDesc'),
    catMuseums: tm('catMuseums'),
    catMuseumsDesc: tm('catMuseumsDesc'),
    catScuba: tm('catScuba'),
    catScubaDesc: tm('catScubaDesc'),
  }

  const faqJsonLd = buildFaqPageJsonLd(faqItems)

  return (
    <div className="flex min-h-screen flex-col bg-surface-warm">
      <JsonLdScript data={faqJsonLd} />
      <PromoBanner locale={locale} message={tm('promoMessage')} ctaLabel={tm('promoCta')} ctaHref="/companions" />
      <Header locale={locale} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[460px] sm:min-h-[560px] flex items-center">
        <div className="absolute inset-0">
          {/* 히어로는 LCP 이미지다. priority 로 미리 불러오고 뷰포트 전체 폭을 요청한다. */}
          <Image
            src="/hero-travel-together.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/75 via-midnight/55 to-midnight/85" />
        </div>
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/90 mb-6 tracking-wide uppercase">
            {tm('playTheWorldBadge')}
          </p>
          <h1 className="ds-hero-display text-white mb-5">
            {tm('heroTitle1')}<br />
            <span className="text-brand-light">{tm('heroTitle2')}</span>
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
            {tm('heroSubtitle')}
          </p>

          {/* 3-way CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link href="/companions">
              <Button className="rounded-full bg-brand hover:bg-brand-hover text-white px-7 font-semibold shadow-lg shadow-brand/30">
                <Users className="w-4 h-4 mr-2" />
                {tm('heroCtaCompanions')}
              </Button>
            </Link>
            <Link href="/guides">
              <Button className="rounded-full bg-[#D4A853] hover:opacity-90 text-white px-7 font-semibold shadow-lg shadow-warning/30">
                <UserCheck className="w-4 h-4 mr-2" />
                {tm('heroCtaGuides')}
              </Button>
            </Link>
            <Link href="/challenges/countries">
              <Button variant="outline" className="rounded-full border-white/40 text-white bg-white/10 hover:bg-white/20 px-7 font-semibold">
                <Trophy className="w-4 h-4 mr-2" />
                {tm('heroCtaChallenge')}
              </Button>
            </Link>
          </div>

          <HeroSearch locale={locale} />
        </div>
      </section>

      {/* ── Three core features ── */}
      <SectionShell variant="light" title={tm('featureSectionTitle')} subtitle={tm('featureSectionSubtitle')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Companion */}
          <Link
            href="/companions"
            className="group block rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-light/70 to-transparent p-8 hover:border-brand/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-5 group-hover:bg-brand/20 transition-colors">
              <Users className="w-7 h-7 text-brand" />
            </div>
            <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-brand bg-brand/10 rounded-full px-2.5 py-0.5 mb-3">
              {tm('featureCompanionBadge')}
            </span>
            <h3 className="text-xl font-bold text-heading mb-3 group-hover:text-brand transition-colors">
              {tm('featureCompanionTitle')}
            </h3>
            <p className="text-subtle text-sm leading-relaxed mb-6">
              {tm('featureCompanionDesc')}
            </p>
            <span className="text-sm font-semibold text-brand inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              {tm('featureCompanionCta')} →
            </span>
          </Link>

          {/* Guide */}
          <Link
            href="/guides"
            className="group block rounded-2xl border border-warning-border/30 bg-gradient-to-br from-warning-light/70 to-transparent p-8 hover:border-gold/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-5 group-hover:bg-gold/20 transition-colors">
              <UserCheck className="w-7 h-7 text-gold" />
            </div>
            <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-gold bg-gold/10 rounded-full px-2.5 py-0.5 mb-3">
              {tm('featureGuideBadge')}
            </span>
            <h3 className="text-xl font-bold text-heading mb-3 group-hover:text-gold transition-colors">
              {tm('featureGuideTitle')}
            </h3>
            <p className="text-subtle text-sm leading-relaxed mb-6">
              {tm('featureGuideDesc')}
            </p>
            <span className="text-sm font-semibold text-gold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              {tm('featureGuideCta')} →
            </span>
          </Link>

          {/* Challenge */}
          <Link
            href="/challenges/countries"
            className="group block rounded-2xl border border-purple-border/40 bg-gradient-to-br from-challenge-light/70 to-transparent p-8 hover:border-challenge/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-challenge/10 flex items-center justify-center mb-5 group-hover:bg-challenge/20 transition-colors">
              <Trophy className="w-7 h-7 text-challenge" />
            </div>
            <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-challenge bg-challenge/10 rounded-full px-2.5 py-0.5 mb-3">
              {tm('featureChallengeBadge')}
            </span>
            <h3 className="text-xl font-bold text-heading mb-3 group-hover:text-challenge transition-colors">
              {tm('featureChallengeTitle')}
            </h3>
            <p className="text-subtle text-sm leading-relaxed mb-6">
              {tm('featureChallengeDesc')}
            </p>
            <span className="text-sm font-semibold text-challenge inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              {tm('featureChallengeCta')} →
            </span>
          </Link>
        </div>
      </SectionShell>

      {/* ── Latest companions ── */}
      <SectionShell
        variant="warm"
        title={tm('latestTitle')}
        subtitle={tm('latestSubtitle')}
        action={
          <Link href="/companions">
            <Button variant="outline" size="sm" className="rounded-full border-brand/30 text-brand hover:bg-brand-light">
              {tm('allTrips')} →
            </Button>
          </Link>
        }
      >
        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentPosts.map(post => (
              <CompanionStoryCard
                key={post.id}
                locale={locale}
                post={post}
                profile={post.profiles as { full_name?: string | null; avatar_url?: string | null; trust_score?: number | null }}
                appCount={0}
                isBookmarked={false}
                userId={null}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-edge bg-surface overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                <p className="text-xs font-bold text-brand uppercase tracking-wider mb-2">{tm('emptyTripsBadge')}</p>
                <h3 className="text-xl font-bold text-heading mb-3">{tm('emptyTripsTitle')}</h3>
                <p className="text-subtle text-sm leading-relaxed mb-6">{tm('emptyTripsDesc')}</p>
                <div className="flex flex-wrap gap-3">
                  <HomeAuthLink loggedInHref="/companions/new">
                    <Button className="bg-brand hover:bg-brand-hover rounded-full">{tm('postTrip')}</Button>
                  </HomeAuthLink>
                  <Link href="/blog/find-travel-companion">
                    <Button variant="outline" className="rounded-full border-brand/30 text-brand">{tm('emptyTripsGuide')}</Button>
                  </Link>
                </div>
              </div>
              <div className="bg-surface-sunken p-8 sm:p-10 border-t lg:border-t-0 lg:border-l border-edge">
                <p className="text-sm font-semibold text-heading mb-4">{tm('emptyTripsWhileTitle')}</p>
                <ul className="space-y-3 text-sm text-subtle">
                  <li className="flex gap-2"><span className="text-challenge">🏆</span>{tm('emptyTripsWhile1')}</li>
                  <li className="flex gap-2"><span className="text-gold">🗺️</span>{tm('emptyTripsWhile2')}</li>
                  <li className="flex gap-2"><span className="text-brand">✈️</span>{tm('emptyTripsWhile3')}</li>
                </ul>
                <Link href="/challenges/countries" className="inline-block mt-6 text-sm font-semibold text-challenge hover:underline">
                  {tm('startChallenge')} →
                </Link>
              </div>
            </div>
          </div>
        )}
      </SectionShell>

      {/* ── Top guides ── */}
      <SectionShell
        variant="sunken"
        title={tm('guidesTitle')}
        subtitle={topGuides.length > 0 ? tm('guidesSubtitle') : tm('emptyGuidesSubtitle')}
        action={
          <Link href="/guides">
            <Button variant="outline" size="sm" className="rounded-full border-gold/40 text-gold hover:bg-gold-light">
              {tm('allGuides')} →
            </Button>
          </Link>
        }
      >
        {topGuides.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topGuides.map(guide => {
              const levelInfo = getLevelInfo(guide.travel_level || 1)
              const regions = guide.guide_city_regions ?? []
              const primaryRegion = regions[0]
              const primaryCountry = primaryRegion ? getCountryByCode(primaryRegion.country) : null
              const nationalityCountry = guide.nationality ? getCountryByCode(guide.nationality) : null
              const extraPhotos = guide.profile_photos ?? []
              return (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.id}`}
                  className="group block h-full rounded-2xl border border-edge/60 bg-surface overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-gold/40 transition-all duration-200"
                >
                  <GuidePhotoCarousel
                    avatar={guide.avatar_url}
                    photos={extraPhotos}
                    name={guide.full_name || ''}
                    levelLabel={`${levelInfo.badge} Lv.${guide.travel_level || 1}`}
                    levelColor={levelInfo.color}
                    guideId={guide.id}
                    countryCode={primaryRegion?.country ?? guide.nationality ?? null}
                    countryName={primaryCountry?.name ?? nationalityCountry?.name ?? null}
                    city={primaryRegion?.cities[0] ?? null}
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-bold text-heading truncate group-hover:text-gold transition-colors">
                          {guide.full_name ?? tm('allGuides')}
                        </p>
                        {nationalityCountry && (
                          <p className="text-xs text-subtle mt-0.5 flex items-center gap-1.5">
                            <CountryFlag code={nationalityCountry.code} size="xs" />
                            {nationalityCountry.name}
                          </p>
                        )}
                      </div>
                      {guide.trust_score != null && guide.trust_score > 0 && (
                        <span className="shrink-0 text-xs font-semibold text-gold">★ {guide.trust_score.toFixed(1)}</span>
                      )}
                    </div>
                    <GuideRateDisplay rate={guide.guide_hourly_rate ?? null} rateCurrency={guide.rate_currency} />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-10 px-6 rounded-2xl border border-edge bg-surface">
            <p className="text-subtle text-sm leading-relaxed mb-6">{tm('emptyGuidesDesc')}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <HomeAuthLink loggedInHref="/profile/edit">
                <Button className="rounded-full bg-gold hover:bg-gold/90 text-heading">{tm('becomeGuide')}</Button>
              </HomeAuthLink>
              <Link href="/blog/become-local-guide">
                <Button variant="outline" className="rounded-full border-gold/40 text-gold">{tm('emptyGuidesLearn')}</Button>
              </Link>
            </div>
          </div>
        )}
      </SectionShell>

      {/* ── Challenge spotlight ── */}
      <SectionShell variant="warm">
        {certSpotlight.length > 0 ? (
          <ChallengeSpotlight
            certs={certSpotlight}
            locale={locale}
            title={tm('challengeTitle')}
            subtitle={tm('challengeSubtitle')}
            badgeLabel={tNav('challenges')}
            viewAllLabel={tm('viewCertFeed')}
            pointsLabel={tm('pts')}
          />
        ) : (
          <ChallengeCategoriesGrid
            locale={locale}
            title={tm('challengeEmptyTitle')}
            subtitle={tm('challengeEmptySubtitle')}
            badgeLabel={tChallenges('challengeCountBadge', { count: TOTAL_CHALLENGES })}
            viewAllLabel={tm('viewAllChallenges')}
            startLabel={tm('startChallenge')}
            labels={challengeCategoryLabels}
          />
        )}
      </SectionShell>

      {/* ── Why mytripfy ── */}
      <SectionShell variant="light">
        <ValuePropGrid pillars={pillars} title={tm('whyTitle')} subtitle={tm('whySubtitle')} />
      </SectionShell>

      {/* ── Destinations ── */}
      <SectionShell
        variant="sunken"
        title={tm('destinationsTitle')}
        subtitle={tm('destinationsSubtitle')}
      >
        <DestinationCarousel destinations={popularDestinations} locale={locale} viewAllLabel={tm('viewAllDestinations')} />
      </SectionShell>

      {/* ── Hall of Fame ── */}
      <SectionShell
        variant="light"
        title={tm('hallOfFameTitle')}
        subtitle={hallOfFameTop5.length > 0 ? undefined : tm('hallOfFameEmptySubtitle')}
        action={
          <Link href="/hall-of-fame">
            <Button variant="outline" size="sm" className="rounded-full border-gold/40 text-gold hover:bg-gold-light">
              {tm('viewRanking')} →
            </Button>
          </Link>
        }
      >
        {hallOfFameTop5.length > 0 ? (
          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
            {hallOfFameTop5.map((row, idx) => {
              const medals = ['🥇', '🥈', '🥉']
              const medal = medals[idx]
              const avatarSize = idx === 0 ? 'w-20 h-20 sm:w-24 sm:h-24' : idx < 3 ? 'w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20' : 'w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]'
              const cardBg = idx === 0
                ? 'bg-gradient-to-r from-gold-light to-warning-light border-gold/50 hover:border-gold/70 hover:shadow-gold/20'
                : idx === 1
                  ? 'bg-surface-sunken border-edge/80 hover:border-edge-strong'
                  : idx === 2
                    ? 'bg-gradient-to-r from-sunset-light to-warning-light/50 border-sunset-border/60 hover:border-sunset-border/60'
                    : 'bg-surface border-edge/60 hover:border-gold/30'
              const ringStyle = idx === 0 ? 'ring-4 ring-gold/50' : idx === 1 ? 'ring-2 ring-edge-strong/70' : idx === 2 ? 'ring-2 ring-sunset-border/60' : 'ring-2 ring-edge/80'
              return (
                <Link key={row.id} href={`/users/${row.id}`}>
                  <div className={`flex items-center gap-4 sm:gap-5 rounded-2xl p-4 sm:p-5 border transition-all hover:shadow-md ${cardBg}`}>
                    <span className={`text-xl sm:text-2xl shrink-0 ${idx >= 3 ? 'text-subtle text-base font-bold px-1' : ''}`}>
                      {medal ?? (
                        <span className="w-8 h-8 rounded-full bg-gold-light text-gold-strong font-bold flex items-center justify-center text-sm">
                          {idx + 1}
                        </span>
                      )}
                    </span>
                    <div className={`${avatarSize} rounded-full bg-surface-sunken overflow-hidden shrink-0 ${ringStyle}`}>
                      {row.avatar_url ? (
                        <Avatar src={row.avatar_url} name={row.full_name} size={96} fill />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Award className={`${idx < 3 ? 'w-8 h-8' : 'w-6 h-6'} text-hint`} />
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-heading flex-1 truncate text-base sm:text-lg">{row.full_name ?? tm('traveler')}</span>
                    <span className={`font-bold text-base sm:text-lg shrink-0 ${idx === 0 ? 'text-gold text-xl sm:text-2xl' : 'text-gold'}`}>{row.total_points ?? 0} {tm('pts')}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="max-w-xl mx-auto text-center py-8">
            <p className="text-subtle text-sm mb-6">{tm('hallOfFameEmptyDesc')}</p>
            <Link href="/challenges/countries">
              <Button className="rounded-full bg-challenge hover:opacity-90">{tm('startChallenge')}</Button>
            </Link>
          </div>
        )}
      </SectionShell>

      {/* ── Testimonials ── */}
      <SectionShell variant="sunken">
        <TestimonialTabs title={tm('testimonialsTitle')} items={testimonials} />
      </SectionShell>

      {/* ── Trust ── */}
      <SectionShell variant="dark">
        <TrustStack title={tm('trustTitle')} items={trustItems} />
      </SectionShell>

      {/* ── How it works ── */}
      <SectionShell variant="light" title={tm('howTitle')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto mb-8">
          {[
            { step: '01', icon: UserCheck, title: tm('howStep1Title'), desc: tm('howStep1Desc') },
            { step: '02', icon: Search, title: tm('howStep2Title'), desc: tm('howStep2Desc') },
            { step: '03', icon: Star, title: tm('howStep3Title'), desc: tm('howStep3Desc') },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-white mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <div className="text-xs font-black text-brand tracking-widest mb-2">{item.step}</div>
              <h3 className="font-bold text-heading mb-2">{item.title}</h3>
              <p className="text-sm text-subtle leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/how-it-works">
            <Button variant="outline" className="rounded-full border-brand/30 text-brand hover:bg-brand-light">
              {tm('howCta')} →
            </Button>
          </Link>
        </div>
      </SectionShell>

      {/* ── FAQ ── */}
      <SectionShell variant="warm">
        <FaqAccordion title={tm('faqTitle')} items={faqItems} />
      </SectionShell>

      {/* ── Final CTA ── */}
      <HomeFinalCta
        title={tm('ctaTitle')}
        subtitle={tm('ctaSubtitle')}
        joinLabel={tm('joinFree')}
        browseLabel={tm('browseTrips')}
      />
    </div>
  )
}
