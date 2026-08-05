import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import { createAdminClient } from '@/utils/supabase/server'
import { getCountryByCode } from '@/data/countries'
import { getDestinationCover } from '@/data/destination-covers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { BEACHHEAD_CITIES } from '@/lib/admin/beachhead-cities'

const FALLBACK_CODES = ['JP', 'TH', 'KR', 'IT', 'FR', 'US', 'ES', 'VN', 'AU', 'GB', 'DE', 'PT']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  return buildPageMetadata({
    locale,
    path: '/destinations',
    title: tm('destinationsPageTitle'),
    description: tm('destinationsPageSubtitle'),
    keywords: ['travel destinations', 'companions by country', 'mytripfy'],
  })
}

export const revalidate = 300

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  // 공개 집계만 읽으므로 auth() 를 타지 않는 클라이언트를 써서 ISR 을 유지한다.
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: rows } = await supabase
    .from('companion_posts')
    .select('destination_country')
    .eq('status', 'open')
    .gte('end_date', today)
    .not('destination_country', 'is', null)

  const countByCountry = new Map<string, number>()
  for (const row of rows ?? []) {
    const code = (row as { destination_country: string }).destination_country
    if (code?.trim()) countByCountry.set(code, (countByCountry.get(code) ?? 0) + 1)
  }

  const sorted = [...countByCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, count }))

  const used = new Set(sorted.map(d => d.code))
  for (const code of FALLBACK_CODES) {
    if (!used.has(code)) sorted.push({ code, count: 0 })
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <Header locale={locale} />

      <section className="relative bg-midnight text-white py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-midnight to-brand-deep/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">{tm('destinationsPageTitle')}</h1>
          <p className="text-white/70 max-w-xl leading-relaxed">{tm('destinationsPageSubtitle')}</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xl sm:text-2xl font-bold text-heading mb-4">{tm('beachheadHeading')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {BEACHHEAD_CITIES.map((c) => (
            <Link
              key={c.id}
              href={`/${locale}/destinations/${c.id}`}
              className="rounded-2xl border border-edge/60 bg-surface px-4 py-3.5 hover:border-brand/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <p className="text-xs text-subtle uppercase tracking-wide">{c.countryCode}</p>
              <p className="font-bold text-heading mt-0.5">{locale === 'ko' ? c.label : c.labelEn}</p>
              <p className="text-xs text-brand mt-1.5 font-medium">{tm('beachheadViewTrips')}</p>
            </Link>
          ))}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-heading mb-4">{tm('byCountryHeading')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sorted.map(({ code, count }, idx) => {
            const country = getCountryByCode(code)
            const name = country?.name ?? code
            return (
              <Link
                key={code}
                href={`/${locale}/companions?country=${code}`}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-edge/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <Image
                  src={getDestinationCover(code)}
                  alt={name}
                  fill
                  priority={idx < 8}
                  loading={idx < 8 ? 'eager' : 'lazy'}
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-0.5">{code}</p>
                  <h2 className="text-white text-lg font-bold">{name}</h2>
                  <p className="text-white/80 text-xs mt-1">
                    {count > 0
                      ? tm('destinationsTripCount', { count })
                      : tm('destinationsBrowse')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href={`/${locale}/companions`}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-hover transition-colors shadow-md shadow-brand/20"
          >
            {tm('viewAllDestinations')} →
          </Link>
        </div>
      </main>
    </div>
  )
}
