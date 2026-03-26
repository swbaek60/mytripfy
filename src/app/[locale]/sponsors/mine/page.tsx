import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { getTranslations } from 'next-intl/server'
import CountryFlag from '@/components/CountryFlag'

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
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('id, name, name_en, business_type, country_code, city, status, logo_url, sponsor_benefits(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/sponsors" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-heading">{t('mySponsors')}</h1>
          <Link href={`/${locale}/sponsors/new`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">+ {t('addSponsor')}</Button>
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
                      {s.logo_url ? <img src={s.logo_url} alt="" className="w-full h-full object-cover" /> : '🏪'}
                    </div>
                    <div>
                      <p className="font-bold text-heading">{displayName}</p>
                      <p className="text-xs text-subtle flex items-center gap-1">
                        {countryInfo && <CountryFlag code={countryInfo.code} size="xs" />}
                        {t(BUSINESS_TYPE_KEYS[s.business_type] || 'other')}
                        {s.city && ` · ${s.city}`}
                      </p>
                      <p className="text-xs text-emerald-600">{benefitsCount} {t('benefits')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/${locale}/sponsors/${s.id}`}>
                      <Button variant="outline" size="sm" className="rounded-full">View</Button>
                    </Link>
                    <Link href={`/${locale}/sponsors/${s.id}/edit`}>
                      <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700">Edit</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface rounded-2xl border border-edge">
            <p className="text-subtle mb-4">No stores registered yet.</p>
            <Link href={`/${locale}/sponsors/new`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">+ {t('addSponsor')}</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
