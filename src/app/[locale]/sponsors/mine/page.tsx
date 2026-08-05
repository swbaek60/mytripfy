import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { getTranslations } from 'next-intl/server'
import CountryFlag from '@/components/CountryFlag'
import SmartImage from '@/components/ui/SmartImage'

import type { Metadata } from 'next'
import { buildPrivateMetadata } from '@/lib/seo/private-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPrivateMetadata({ locale, path: '/sponsors/mine', namespace: 'Sponsors', titleKey: 'mySponsors' })
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

export default async function MySponsorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Sponsors' })
  const tc = await getTranslations({ locale, namespace: 'Common' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/sponsors/mine`)}`)

  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('id, name, name_en, business_type, country_code, city, status, logo_url, sponsor_benefits(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-heading">{t('mySponsors')}</h1>
          <Link href={`/${locale}/sponsors/new`}>
            <Button className="bg-success hover:bg-success-strong rounded-full">+ {t('addSponsor')}</Button>
          </Link>
        </div>
        {sponsors && sponsors.length > 0 ? (
          <div className="space-y-3">
            {sponsors.map(s => {
              const countryInfo = getCountryByCode(s.country_code)
              const benefitsCount = Array.isArray(s.sponsor_benefits) ? s.sponsor_benefits.length : 0
              const displayName = locale.startsWith('ko') && s.name ? s.name : (s.name_en || s.name)
              return (
                <div key={s.id} className="bg-surface rounded-2xl p-4 shadow-sm border border-edge flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-sunken overflow-hidden flex items-center justify-center text-xl shrink-0">
                      {s.logo_url ? <SmartImage src={s.logo_url} alt="" width={96} height={96} className="w-full h-full object-cover" /> : '🏪'}
                    </div>
                    <div>
                      <p className="font-bold text-heading">{displayName}</p>
                      <p className="text-xs text-subtle flex items-center gap-1">
                        {countryInfo && <CountryFlag code={countryInfo.code} size="xs" />}
                        {t(BUSINESS_TYPE_KEYS[s.business_type] || 'other')}
                        {s.city && ` · ${s.city}`}
                      </p>
                      <p className="text-xs text-success">{benefitsCount} {t('benefits')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/${locale}/sponsors/${s.id}`}>
                      <Button variant="outline" size="sm" className="rounded-full">{tc('view')}</Button>
                    </Link>
                    <Link href={`/${locale}/sponsors/${s.id}/edit`}>
                      <Button size="sm" className="rounded-full bg-success hover:bg-success-strong">{tc('edit')}</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface rounded-2xl border border-edge">
            <p className="text-subtle mb-4">{t('noStoresYet')}</p>
            <Link href={`/${locale}/sponsors/new`}>
              <Button className="bg-success hover:bg-success-strong rounded-full">+ {t('addSponsor')}</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
