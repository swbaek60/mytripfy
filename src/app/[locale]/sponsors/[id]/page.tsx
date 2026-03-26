import { createClient, getAuthUser } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import SponsorDetailClient from './SponsorDetailClient'
import SponsorMyVisitCard from './SponsorMyVisitCard'
import SponsorVisitListSection from './SponsorVisitListSection'
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

const BENEFIT_TYPE_KEYS: Record<string, string> = {
  discount_percent: 'discountPercent',
  discount_fixed: 'discountFixed',
  free_item: 'freeItem',
  free_drink: 'freeDrink',
  free_entry: 'freeEntry',
  bogo: 'bogo',
  other: 'otherBenefit',
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('sponsors').select('name, name_en').eq('id', id).eq('status', 'active').single()
  const name = data?.name_en || data?.name || 'Sponsor'
  return { title: `${name} | Sponsors | mytripfy` }
}

export default async function SponsorDetailPage({
  params,
}: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'Sponsors' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!sponsor) notFound()

  const { data: benefits } = await supabase
    .from('sponsor_benefits')
    .select('*')
    .eq('sponsor_id', id)
    .lte('start_date', new Date().toISOString().slice(0, 10))
    .gte('end_date', new Date().toISOString().slice(0, 10))
    .order('created_at', { ascending: false })

  let myVisit: { id: string; status: string; points_granted: number; photo_url: string; created_at: string } | null = null
  if (user) {
    const { data: visit } = await supabase
      .from('sponsor_visits')
      .select('id, status, points_granted, photo_url, created_at')
      .eq('user_id', user.id)
      .eq('sponsor_id', id)
      .single()
    myVisit = visit
  }

  const countryInfo = getCountryByCode(sponsor.country_code)
  const displayName = locale.startsWith('ko') && sponsor.name ? sponsor.name : (sponsor.name_en || sponsor.name)
  const displayDesc = locale.startsWith('ko') && sponsor.description ? sponsor.description : (sponsor.description_en || sponsor.description)

  const mapsUrl = sponsor.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([sponsor.address, sponsor.city, sponsor.region, sponsor.country_code].filter(Boolean).join(', '))}`
    : null

  const VISIT_POINTS = 10

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/sponsors" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Cover + logo + name */}
        <div className="rounded-2xl overflow-hidden bg-surface shadow-sm border border-edge mb-6">
          <div className="h-40 bg-gradient-to-r from-emerald-400 to-teal-500 relative">
            {sponsor.cover_image_url && (
              <img src={sponsor.cover_image_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="px-6 pb-6 pt-4 -mt-12 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-surface shadow-lg border border-edge overflow-hidden shrink-0 flex items-center justify-center text-4xl">
                {sponsor.logo_url ? <img src={sponsor.logo_url} alt="" className="w-full h-full object-cover" /> : '🏪'}
              </div>
              <div className="flex-1 min-h-[4.5rem] flex flex-col justify-end">
                <h1 className="text-2xl font-bold text-heading">{displayName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {countryInfo && (
                    <span className="flex items-center gap-1 text-sm text-subtle">
                      <CountryFlag code={countryInfo.code} size="sm" />
                      {countryInfo.name}
                      {sponsor.city && ` · ${sponsor.city}`}
                    </span>
                  )}
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {t(BUSINESS_TYPE_KEYS[sponsor.business_type] || 'other')}
                  </span>
                </div>
              </div>
              {sponsor.user_id === user?.id && (
                <Link href={`/${locale}/sponsors/${id}/edit`}>
                  <Button variant="outline" size="sm" className="rounded-full">{t('edit')}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {displayDesc && (
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-edge mb-6">
            <h2 className="font-bold text-heading mb-2">About</h2>
            <p className="text-body text-sm whitespace-pre-wrap">{displayDesc}</p>
          </div>
        )}

        {/* Links: Website, Phone, SNS, Directions */}
        <div className="flex flex-wrap gap-2 mb-6">
          {sponsor.website_url && (
            <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-sunken hover:bg-gray-200 text-body text-sm font-medium">
              🔗 {t('website')}
            </a>
          )}
          {sponsor.phone && (
            <a href={`tel:${sponsor.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-sunken hover:bg-gray-200 text-body text-sm font-medium">
              📞 {sponsor.phone}
            </a>
          )}
          {sponsor.instagram_url && (
            <a href={sponsor.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-sunken hover:bg-gray-200 text-body text-sm font-medium">
              Instagram
            </a>
          )}
          {sponsor.facebook_url && (
            <a href={sponsor.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-sunken hover:bg-gray-200 text-body text-sm font-medium">
              Facebook
            </a>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-medium">
              🗺️ {t('directions')}
            </a>
          )}
        </div>

        {/* Benefits */}
        <div className="bg-surface rounded-2xl shadow-sm border border-edge mb-6 overflow-hidden">
          <h2 className="font-bold text-heading px-6 py-4 border-b border-edge">{t('benefits')}</h2>
          {benefits && benefits.length > 0 ? (
            <ul className="divide-y divide-edge">
              {benefits.map(b => {
                const benefitLabel = b.benefit_type === 'discount_percent' && b.value_num != null
                  ? t('discountPercent', { value: b.value_num })
                  : b.benefit_type === 'discount_fixed' && (b.value_num != null || b.value_text)
                    ? t('discountFixed', { value: b.value_text || b.value_num })
                    : t(BENEFIT_TYPE_KEYS[b.benefit_type] || 'otherBenefit')
                return (
                  <li key={b.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-heading">{b.title_en || b.title}</p>
                      {b.description && <p className="text-sm text-subtle mt-0.5">{b.description}</p>}
                      <p className="text-xs text-hint mt-1">
                        {t('validUntil', { date: new Date(b.end_date).toLocaleDateString(locale.startsWith('ko') ? 'ko-KR' : 'en-US') })}
                      </p>
                    </div>
                    <SponsorDetailClient
                      locale={locale}
                      sponsorId={id}
                      sponsorName={displayName}
                      benefit={b}
                      benefitLabel={benefitLabel}
                      isOwner={sponsor.user_id === user?.id}
                    />
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-6 py-8 text-subtle text-sm">{t('noActiveBenefits')}</p>
          )}
        </div>

        {/* Visit verification — 챌린지 인증과 동일: 버튼 클릭 → 모달에서 사진 업로드 → 즉시 인증 완료 */}
        {user && sponsor.user_id !== user.id && (
          <div className="bg-surface rounded-2xl shadow-sm border border-edge p-6">
            <h2 className="font-bold text-heading mb-1">{t('visitAndVerify')}</h2>
            <p className="text-sm text-subtle mb-4">{t('visitVerifyDesc')}</p>
            {myVisit ? (
              myVisit.status === 'approved' ? (
                <>
                  <SponsorMyVisitCard
                    visitId={myVisit.id}
                    photoUrl={myVisit.photo_url}
                    pointsGranted={myVisit.points_granted}
                    createdAt={myVisit.created_at}
                    locale={locale}
                  />
                  <p className="text-sm text-success font-medium mt-1">✓ {t('visitApproved', { points: myVisit.points_granted })}</p>
                </>
              ) : (
                <p className="text-sm text-subtle">
                  {myVisit.status === 'pending' ? t('visitPending') : myVisit.status === 'rejected' ? t('visitRejected') : null}
                </p>
              )
            ) : (
              <SponsorDetailClient
                locale={locale}
                sponsorId={id}
                sponsorName={displayName}
                benefit={null}
                benefitLabel=""
                isOwner={false}
                visitOnly
                pointsEarned={VISIT_POINTS}
              />
            )}
          </div>
        )}

        {/* 다른 방문자 인증 목록 (API에서 조회) */}
        <SponsorVisitListSection
          sponsorId={id}
          locale={locale}
          canDelete={sponsor.user_id === user?.id}
        />
      </main>
    </div>
  )
}
