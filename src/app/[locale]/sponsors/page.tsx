import { createClient, getAuthUser } from '@/utils/supabase/server'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import SponsorsFilterBar from './SponsorsFilterBar'
import CountryFlag from '@/components/CountryFlag'

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Sponsors' })
  return buildPageMetadata({
    locale,
    path: '/sponsors',
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['travel deals', 'local sponsor', 'restaurant discount', 'mytripfy'],
  })
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
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

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
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/sponsors" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-heading">{t('title')}</h1>
            <p className="text-subtle mt-1 text-sm">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <Link href={`/${locale}/sponsors/new`}>
                <Button className="bg-teal hover:brightness-110 text-white rounded-full text-sm">
                  + {t('addSponsor')}
                </Button>
              </Link>
            )}
            {user && (
              <Link href={`/${locale}/sponsors/mine`}>
                <Button variant="outline" className="border-teal/40 text-teal hover:bg-teal-light rounded-full text-sm">
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
                  className="group block bg-surface rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border border-edge/60 hover:border-teal/30 overflow-hidden"
                >
                  <div className="h-28 bg-gradient-to-r from-teal to-[#0D9488] relative shrink-0">
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
                    <div className="w-12 h-12 rounded-xl bg-surface-sunken shrink-0 overflow-hidden flex items-center justify-center text-xl">
                      {sponsor.logo_url ? (
                        <img src={sponsor.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        '🏪'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-heading truncate group-hover:text-teal transition-colors">
                        {displayName}
                      </h2>
                      {sponsor.city && (
                        <p className="text-xs text-subtle mt-0.5">{sponsor.city}</p>
                      )}
                      {benefitsCount > 0 && (
                        <p className="text-xs text-teal font-medium mt-1">{benefitsCount} {t('benefits')}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface rounded-2xl border border-edge">
            <p className="text-subtle">{t('noSponsors')}</p>
            {user && (
              <Link href={`/${locale}/sponsors/new`} className="inline-block mt-3">
                <Button className="bg-teal hover:brightness-110 rounded-full text-white">+ {t('addSponsor')}</Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
