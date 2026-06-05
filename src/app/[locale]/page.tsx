import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { createClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { getCountryByCode } from '@/data/countries'
import HeroSearch from '@/components/marketing/HeroSearch'
import SocialProofBar from '@/components/marketing/SocialProofBar'
import SectionShell from '@/components/layout/SectionShell'
import ValuePropGrid from '@/components/marketing/ValuePropGrid'
import DestinationCarousel from '@/components/marketing/DestinationCarousel'
import ChallengeSpotlight from '@/components/marketing/ChallengeSpotlight'
import TrustStack, { TRUST_ICONS } from '@/components/marketing/TrustStack'
import TestimonialTabs from '@/components/marketing/TestimonialTabs'
import FaqAccordion from '@/components/marketing/FaqAccordion'
import PromoBanner from '@/components/layout/PromoBanner'
import CompanionStoryCard from '@/components/explore/CompanionStoryCard'
import GuideRateDisplay from '@/components/GuideRateDisplay'
import CountryFlag from '@/components/CountryFlag'
import { Users, ShieldCheck, Map as MapIcon, Trophy, UserCheck, Search, Star, Award } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

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
  let postCount = 0
  let guideCount = 0
  let certCount = 0
  let countryCount = 0
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
    const { userId } = await auth()
    isLoggedIn = !!userId
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: pc },
      { count: gc },
      { count: cc },
      { data: rp },
      { data: tg },
      { data: hf5 },
      { data: certs },
      { data: ccr },
    ] = await Promise.all([
      supabase.from('companion_posts').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_guide', true),
      supabase.from('challenge_certifications').select('*', { count: 'exact', head: true }).neq('dispute_status', 'invalidated'),
      supabase
        .from('companion_posts')
        .select('id, title, start_date, end_date, destination_country, destination_city, purpose, cover_image, status, profiles(id, full_name, avatar_url, trust_score)')
        .eq('status', 'open')
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, nationality, trust_score, guide_hourly_rate, rate_currency')
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

    postCount = pc ?? 0
    guideCount = gc ?? 0
    certCount = cc ?? 0
    recentPosts = (rp as unknown as PostRow[]) ?? []
    topGuides = (tg as GuideRow[]) ?? []
    hallOfFameTop5 = (hf5 as LeaderboardRow[]) ?? []
    spotlightCerts = (certs as unknown as CertRow[]) ?? []

    const countByCountry = new Map<string, number>()
    for (const row of ccr ?? []) {
      const code = (row as { destination_country: string }).destination_country
      if (code) countByCountry.set(code, (countByCountry.get(code) ?? 0) + 1)
    }
    countryCount = countByCountry.size
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
  ]

  const faqItems = [
    { question: tm('faq1Q'), answer: tm('faq1A') },
    { question: tm('faq2Q'), answer: tm('faq2A') },
    { question: tm('faq3Q'), answer: tm('faq3A') },
    { question: tm('faq4Q'), answer: tm('faq4A') },
    { question: tm('faq5Q'), answer: tm('faq5A') },
  ]

  const certSpotlight = spotlightCerts.map(c => ({
    user_id: c.user_id,
    challenge_id: c.challenge_id,
    image_url: c.image_url,
    title: c.challenges?.title_en ?? 'Challenge',
    userName: c.profiles?.full_name ?? 'Traveler',
    points: c.challenges?.points ?? 0,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-surface-warm">
      <PromoBanner locale={locale} message={tm('promoMessage')} ctaLabel={tm('promoCta')} ctaHref="/companions" />
      <Header locale={locale} currentPath="/" />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[480px] sm:min-h-[560px] flex items-center">
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

      <SocialProofBar
        postCount={postCount}
        guideCount={guideCount}
        certCount={certCount}
        countryCount={countryCount || popularDestinations.length}
        labels={{
          companions: tm('socialCompanions'),
          guides: tm('socialGuides'),
          certs: tm('socialCerts'),
          countries: tm('socialCountries'),
        }}
      />

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
          <div className="text-center py-16 bg-surface rounded-2xl border border-edge">
            <p className="text-subtle font-medium mb-4">{tm('allTrips')}</p>
            <Link href={isLoggedIn ? '/companions/new' : '/login'}>
              <Button className="bg-brand hover:bg-brand-hover rounded-full">{tm('browseTrips')}</Button>
            </Link>
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
      {topGuides.length > 0 && (
        <SectionShell
          variant="light"
          title={tm('guidesTitle')}
          subtitle={tm('guidesSubtitle')}
          action={
            <Link href="/guides">
              <Button variant="outline" size="sm" className="rounded-full border-gold/40 text-gold hover:bg-gold-light">
                {tm('allGuides')} →
              </Button>
            </Link>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topGuides.map(guide => (
              <Link key={guide.id} href={`/guides/${guide.id}`} className="ds-card-interactive p-5 block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gold-light overflow-hidden shrink-0">
                    {guide.avatar_url ? (
                      <img src={guide.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-gold font-bold">
                        {(guide.full_name ?? 'G').charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-heading truncate">{guide.full_name ?? tm('allGuides')}</p>
                    {guide.nationality && (
                      <CountryFlag code={guide.nationality} size="sm" />
                    )}
                  </div>
                </div>
                {guide.trust_score != null && guide.trust_score > 0 && (
                  <p className="text-xs text-subtle mb-2">★ {guide.trust_score.toFixed(1)}</p>
                )}
                <GuideRateDisplay rate={guide.guide_hourly_rate ?? null} rateCurrency={guide.rate_currency} />
              </Link>
            ))}
          </div>
        </SectionShell>
      )}

      {/* Challenge spotlight */}
      {certSpotlight.length > 0 && (
        <SectionShell variant="warm">
          <ChallengeSpotlight
            certs={certSpotlight}
            locale={locale}
            title={tm('challengeTitle')}
            subtitle={tm('challengeSubtitle')}
            viewAllLabel={tm('viewCertFeed')}
          />
        </SectionShell>
      )}

      {/* Hall of Fame */}
      {hallOfFameTop5.length > 0 && (
        <SectionShell
          variant="light"
          title={tm('hallOfFameTitle')}
          action={
            <Link href="/hall-of-fame">
              <Button variant="outline" size="sm" className="rounded-full border-gold/40 text-gold hover:bg-gold-light">
                {tm('viewRanking')} →
              </Button>
            </Link>
          }
        >
          <div className="flex flex-col gap-3 max-w-2xl mx-auto">
            {hallOfFameTop5.map((row, idx) => (
              <Link key={row.id} href={`/users/${row.id}`}>
                <div className="flex items-center gap-4 bg-surface rounded-xl p-4 border border-edge/60 hover:border-gold/30 hover:shadow-md transition-all">
                  <span className="w-8 h-8 rounded-full bg-gold-light text-gold font-bold flex items-center justify-center text-sm">{idx + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-surface-sunken overflow-hidden">
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Award className="w-5 h-5 text-hint m-auto mt-2.5" />
                    )}
                  </div>
                  <span className="font-semibold text-heading flex-1 truncate">{row.full_name ?? 'Traveler'}</span>
                  <span className="text-gold font-bold">{row.total_points ?? 0} pts</span>
                </div>
              </Link>
            ))}
          </div>
        </SectionShell>
      )}

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
