import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import SponsorsFilterBar from './SponsorsFilterBar'
import CountryFlag from '@/components/CountryFlag'

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Sponsors' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

const BUSINESS_TYPE_KEYS: Record<string, string> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  bar: 'bar',
  shop: 'shop',
  accommodation: 'accommodation',
  experience: 'experience',
  other: 'other',
}

export default async function SponsorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ country?: string; type?: string; q?: string }>
}) {
  const { locale } = await params
  const { country, type, q } = await searchParams
  const t = await getTranslations({ locale, namespace: 'Sponsors' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('sponsors')
    .select('id, name, name_en, description, business_type, country_code, city, logo_url, cover_image_url, sponsor_benefits(id)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (country) query = query.eq('country_code', country)
  if (type && BUSINESS_TYPE_KEYS[type]) query = query.eq('business_type', type)

  const { data: sponsors } = await query

  let list = sponsors ?? []
  if (q?.trim()) {
    const ql = q.toLowerCase().trim()
    list = list.filter(
      s =>
        (s.name || '').toLowerCase().includes(ql) ||
        (s.name_en || '').toLowerCase().includes(ql) ||
        (s.city || '').toLowerCase().includes(ql)
    )
  }

  const totalCount = list.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/sponsors" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">🏪 {t('title')}</h1>
            <p className="text-gray-500 mt-1 text-sm">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <Link href={`/${locale}/sponsors/new`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm">
                  + {t('addSponsor')}
                </Button>
              </Link>
            )}
            {user && (
              <Link href={`/${locale}/sponsors/mine`}>
                <Button variant="outline" className="border-emerald-400 text-emerald-600 hover:bg-emerald-50 rounded-full text-sm">
                  {t('mySponsors')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        <SponsorsFilterBar locale={locale} currentCountry={country} currentType={type} currentQ={q} />

        {list.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(sponsor => {
              const countryInfo = getCountryByCode(sponsor.country_code)
              const benefitsCount = Array.isArray(sponsor.sponsor_benefits) ? sponsor.sponsor_benefits.length : 0
              const displayName = locale.startsWith('ko') && sponsor.name ? sponsor.name : (sponsor.name_en || sponsor.name)

              return (
                <Link
                  key={sponsor.id}
                  href={`/${locale}/sponsors/${sponsor.id}`}
                  className="group block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-emerald-200 overflow-hidden"
                >
                  <div className="h-28 bg-gradient-to-r from-emerald-400 to-teal-500 relative shrink-0">
                    {sponsor.cover_image_url ? (
                      <img src={sponsor.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                      {countryInfo && <CountryFlag code={countryInfo.code} size="sm" />}
                      <span className="text-xs font-medium text-white/90 bg-black/30 px-2 py-0.5 rounded">
                        {t(BUSINESS_TYPE_KEYS[sponsor.business_type] || 'other')}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center text-xl">
                      {sponsor.logo_url ? (
                        <img src={sponsor.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        '🏪'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                        {displayName}
                      </h2>
                      {sponsor.city && (
                        <p className="text-xs text-gray-500 mt-0.5">{sponsor.city}</p>
                      )}
                      {benefitsCount > 0 && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">{benefitsCount} {t('benefits')}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500">{t('noSponsors')}</p>
            {user && (
              <Link href={`/${locale}/sponsors/new`} className="inline-block mt-3">
                <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">+ {t('addSponsor')}</Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
