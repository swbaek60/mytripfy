import Link from 'next/link'
import Header from '@/components/Header'
import { getAdminClientSafe } from '@/utils/supabase/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import HomeAuthLink from '@/components/marketing/HomeAuthLink'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { BEACHHEAD_CITIES, getBeachheadById, matchesBeachheadCity } from '@/lib/admin/beachhead-cities'
import CompanionStoryCard from '@/components/explore/CompanionStoryCard'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd } from '@/lib/seo/json-ld'

export const revalidate = 120

export function generateStaticParams() {
  return BEACHHEAD_CITIES.flatMap((c) =>
    ['en', 'ko'].map((locale) => ({ locale, city: c.id }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; city: string }>
}): Promise<Metadata> {
  const { locale, city: cityId } = await params
  const city = getBeachheadById(cityId)
  if (!city) return {}
  const name = locale === 'ko' ? city.label : city.labelEn
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  return buildPageMetadata({
    locale,
    path: `/destinations/${city.id}`,
    title: tm('citySeoTitle', { city: name }),
    description: tm('citySeoDescription', { city: name }),
    keywords: city.seoKeywords,
  })
}

export default async function BeachheadCityPage({
  params,
}: {
  params: Promise<{ locale: string; city: string }>
}) {
  const { locale, city: cityId } = await params
  const city = getBeachheadById(cityId)
  if (!city) notFound()
  setRequestLocale(locale)

  const name = locale === 'ko' ? city.label : city.labelEn
  const country = getCountryByCode(city.countryCode)
  // 공개 모집글만 읽는다. auth() 를 타면 ISR 이 깨지므로 로그인 여부는
  // 클라이언트 컴포넌트(HomeAuthLink / CompanionStoryCard)에서 판별한다.
  // CI 처럼 서비스 키가 없으면 빈 목록으로 골격만 생성한다.
  const supabase = getAdminClientSafe()
  const today = new Date().toISOString().split('T')[0]
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  const t = await getTranslations({ locale, namespace: 'Companions' })

  const { data: postsRaw } = supabase
    ? await supabase
        .from('companion_posts')
        .select(`
      *,
      profiles ( id, full_name, avatar_url, trust_score )
    `)
        .eq('status', 'open')
        .eq('destination_country', city.countryCode)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(40)
    : { data: null }

  const posts = (postsRaw ?? []).filter((p) =>
    matchesBeachheadCity(city, p.destination_country, p.destination_city)
  )

  const appCountMap: Record<string, number> = {}
  if (supabase && posts.length > 0) {
    const { data: counts } = await supabase
      .from('companion_post_application_counts')
      .select('post_id, count')
      .in('post_id', posts.map((p) => p.id))
    counts?.forEach((r: { post_id: string; count: number }) => {
      appCountMap[r.post_id] = r.count
    })
  }

  const breadcrumb = buildBreadcrumbJsonLd(locale, [
    { name: tm('destinationsPageTitle'), path: '/destinations' },
    { name, path: `/destinations/${city.id}` },
  ])

  return (
    <div className="min-h-screen bg-surface-warm">
      <JsonLdScript data={breadcrumb} />
      <Header locale={locale} />

      <section className="relative bg-midnight text-white py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-midnight to-brand-deep/25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-white/50 mb-2">
            <Link href={`/${locale}/destinations`} className="hover:text-white transition-colors">
              {tm('destinationsPageTitle')}
            </Link>
            {' / '}
            {country?.name ?? city.countryCode}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
            {tm('cityHeroTitle', { city: name })}
          </h1>
          <p className="text-white/70 max-w-2xl mb-6 leading-relaxed">
            {tm('cityHeroSubtitle', { count: posts.length })}
          </p>
          <div className="flex flex-wrap gap-3">
            <HomeAuthLink loggedInHref="/companions/new" loggedOutHref="/login">
              <Button className="rounded-full bg-brand hover:bg-brand-hover shadow-md shadow-brand/25">
                {tm('cityPostTrip')}
              </Button>
            </HomeAuthLink>
            <Link href={`/${locale}/companions?country=${city.countryCode}&q=${encodeURIComponent(city.labelEn)}`}>
              <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
                {tm('cityBrowseAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-subtle mb-4">{tm('cityEmpty')}</p>
            <HomeAuthLink loggedInHref="/companions/new" loggedOutHref="/login">
              <Button className="rounded-full bg-brand hover:bg-brand-hover">
                {t('post')}
              </Button>
            </HomeAuthLink>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const profile = (post.profiles as {
                full_name?: string | null
                avatar_url?: string | null
                trust_score?: number | null
              }) || {}
              return (
                <CompanionStoryCard
                  key={post.id}
                  locale={locale}
                  post={post}
                  profile={profile}
                  appCount={appCountMap[post.id] ?? 0}
                  isBookmarked={false}
                />
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
