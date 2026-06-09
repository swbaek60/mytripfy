import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { createClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
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
import { getLevelInfo, getCountryByCode } from '@/data/countries'
import type { GuideRegion } from '@/data/cities'
import { Users, ShieldCheck, Map as MapIcon, Trophy, UserCheck, Search, Star, Award } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildFaqPageJsonLd } from '@/lib/seo/json-ld'

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

export const dynamic = 'force-dynamic'

const POPULAR_FALLBACK = ['JP', 'TH', 'IT', 'FR', 'US', 'AU', 'ES', 'VN']

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const tm = await getTranslations({ locale, namespace: 'Marketing' })

  let isLoggedIn = false
  let userId: string | null = null
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
  let popularCodes: string[] = []

  try {
    const authResult = await auth()
    userId = authResult.userId ?? null
    isLoggedIn = !!userId
    const supabase = await createClient()
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
    { icon: Users, title: tm('pillarMatchTitle'), description: tm('pillarMatchDesc'), accent: '#2563EB' },
    { icon: ShieldCheck, title: tm('pillarVerifyTitle'), description: tm('pillarVerifyDesc'), accent: '#0D9488' },
    { icon: MapIcon, title: tm('pillarExploreTitle'), description: tm('pillarExploreDesc'), accent: '#D4A853' },
    { icon: Trophy, title: tm('pillarEarnTitle'), description: tm('pillarEarnDesc'), accent: '#7C3AED' },
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
    title: c.challenges?.title_en ?? 'Challenge',
    userName: c.profiles?.full_name ?? 'Traveler',
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
      <Header locale={locale} currentPath="/" />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[400px] sm:min-h-[520px] flex items-center">
        <div className="absolute inset-0">
          <img src="/hero-travel-together.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/70 via-midnight/50 to-midnight/80" />
        </div>
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="ds-hero-display text-white mb-5">
            {tm('heroTitle1')}<br />
            <span className="text-brand-light">{tm('heroTitle2')}</span>
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
            {tm('heroSubtitle')}
          </p>
          <HeroSearch locale={locale} />
        </div>
      </section>


      {/* Latest companions */}
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
                  <Link href={isLoggedIn ? '/companions/new' : '/login'}>
                    <Button className="bg-brand hover:bg-brand-hover rounded-full">{tm('postTrip')}</Button>
                  </Link>
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

      {/* Why mytripfy */}
      <SectionShell variant="light">
        <ValuePropGrid pillars={pillars} title={tm('whyTitle')} subtitle={tm('whySubtitle')} />
      </SectionShell>

      {/* Destinations */}
      <SectionShell
        variant="sunken"
        title={tm('destinationsTitle')}
        subtitle={tm('destinationsSubtitle')}
      >
        <DestinationCarousel destinations={popularDestinations} locale={locale} viewAllLabel={tm('viewAllDestinations')} />
      </SectionShell>

      {/* Top guides */}
      <SectionShell
        variant="light"
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
                    userId={userId}
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
          <div className="max-w-2xl mx-auto text-center py-10 px-6 rounded-2xl border border-edge bg-surface-sunken">
            <p className="text-subtle text-sm leading-relaxed mb-6">{tm('emptyGuidesDesc')}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={isLoggedIn ? '/profile/edit' : '/login'}>
                <Button className="rounded-full bg-gold hover:bg-gold/90 text-white">{tm('becomeGuide')}</Button>
              </Link>
              <Link href="/blog/become-local-guide">
                <Button variant="outline" className="rounded-full border-gold/40 text-gold">{tm('emptyGuidesLearn')}</Button>
              </Link>
            </div>
          </div>
        )}
      </SectionShell>

      {/* Challenge spotlight or categories fallback */}
      <SectionShell variant="warm">
        {certSpotlight.length > 0 ? (
          <ChallengeSpotlight
            certs={certSpotlight}
            locale={locale}
            title={tm('challengeTitle')}
            subtitle={tm('challengeSubtitle')}
            viewAllLabel={tm('viewCertFeed')}
          />
        ) : (
          <ChallengeCategoriesGrid
            locale={locale}
            title={tm('challengeEmptyTitle')}
            subtitle={tm('challengeEmptySubtitle')}
            viewAllLabel={tm('viewAllChallenges')}
            startLabel={tm('startChallenge')}
            labels={challengeCategoryLabels}
          />
        )}
      </SectionShell>

      {/* Hall of Fame */}
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
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-gold/50 hover:border-gold/70 hover:shadow-gold/20'
                : idx === 1
                  ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200/80 hover:border-slate-300'
                  : idx === 2
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50/50 border-orange-200/60 hover:border-orange-300/60'
                    : 'bg-surface border-edge/60 hover:border-gold/30'
              const ringStyle = idx === 0 ? 'ring-4 ring-gold/50' : idx === 1 ? 'ring-2 ring-slate-300/70' : idx === 2 ? 'ring-2 ring-orange-300/60' : 'ring-2 ring-edge/80'
              return (
                <Link key={row.id} href={`/users/${row.id}`}>
                  <div className={`flex items-center gap-4 sm:gap-5 rounded-2xl p-4 sm:p-5 border transition-all hover:shadow-md ${cardBg}`}>
                    <span className={`text-xl sm:text-2xl shrink-0 ${idx >= 3 ? 'text-subtle text-base font-bold px-1' : ''}`}>
                      {medal ?? <span className="w-8 h-8 rounded-full bg-gold-light text-gold font-bold flex items-center justify-center text-sm">{idx + 1}</span>}
                      {!medal && <span className="w-8 h-8 rounded-full bg-gold-light text-gold font-bold flex items-center justify-center text-sm">{idx + 1}</span>}
                    </span>
                    <div className={`${avatarSize} rounded-full bg-surface-sunken overflow-hidden shrink-0 ${ringStyle}`}>
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Award className={`${idx < 3 ? 'w-8 h-8' : 'w-6 h-6'} text-hint`} />
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-heading flex-1 truncate text-base sm:text-lg">{row.full_name ?? 'Traveler'}</span>
                    <span className={`font-bold text-base sm:text-lg shrink-0 ${idx === 0 ? 'text-gold text-xl sm:text-2xl' : 'text-gold'}`}>{row.total_points ?? 0} pts</span>
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

      {/* Testimonials */}
      <SectionShell variant="sunken">
        <TestimonialTabs title={tm('testimonialsTitle')} items={testimonials} />
      </SectionShell>

      {/* Trust */}
      <SectionShell variant="dark">
        <TrustStack title={tm('trustTitle')} items={trustItems} />
      </SectionShell>

      {/* How it works */}
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

      {/* FAQ */}
      <SectionShell variant="warm">
        <FaqAccordion title={tm('faqTitle')} items={faqItems} />
      </SectionShell>

      {/* CTA */}
      {!isLoggedIn && (
        <section className="py-16 sm:py-24 bg-gradient-to-br from-brand via-brand-deep to-midnight relative overflow-hidden">
          <div className="relative max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{tm('ctaTitle')}</h2>
            <p className="text-white/70 text-lg mb-10">{tm('ctaSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-white text-brand hover:bg-brand-light rounded-full px-10 font-bold w-full sm:w-auto">
                  {tm('joinFree')}
                </Button>
              </Link>
              <Link href="/companions">
                <Button size="lg" variant="outline" className="border-2 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white rounded-full px-10 w-full sm:w-auto">
                  {tm('browseTrips')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
