import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getCountryByCode } from '@/data/countries'
import CountryFlag from '@/components/CountryFlag'

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
}: { params: Promise<{ locale: string; id: string; benefitId: string }> }): Promise<Metadata> {
  const { id, benefitId } = await params
  const supabase = await createClient()
  const { data: sponsor } = await supabase.from('sponsors').select('name, name_en').eq('id', id).eq('status', 'active').single()
  const { data: benefit } = await supabase.from('sponsor_benefits').select('title, title_en').eq('id', benefitId).eq('sponsor_id', id).single()
  const name = sponsor?.name_en || sponsor?.name || 'Sponsor'
  const title = benefit?.title_en || benefit?.title || 'Coupon'
  return { title: `${title} | ${name} | mytripfy` }
}

export default async function CouponCapturePage({
  params,
}: { params: Promise<{ locale: string; id: string; benefitId: string }> }) {
  const { locale, id, benefitId } = await params
  const t = await getTranslations({ locale, namespace: 'Sponsors' })
  const supabase = await createClient()

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('name, name_en, country_code, region, city, address, phone, website_url, instagram_url, facebook_url, twitter_url')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  const { data: benefit } = await supabase
    .from('sponsor_benefits')
    .select('*')
    .eq('id', benefitId)
    .eq('sponsor_id', id)
    .single()

  if (!sponsor || !benefit) notFound()

  const today = new Date().toISOString().slice(0, 10)
  if (benefit.end_date < today) notFound()

  const displayName = locale.startsWith('ko') && sponsor.name ? sponsor.name : (sponsor.name_en || sponsor.name)
  const benefitTitle = benefit.title_en || benefit.title
  const benefitLabel =
    benefit.benefit_type === 'discount_percent' && benefit.value_num != null
      ? t('discountPercent', { value: benefit.value_num })
      : benefit.benefit_type === 'discount_fixed' && (benefit.value_num != null || benefit.value_text)
        ? t('discountFixed', { value: benefit.value_text || benefit.value_num })
        : t(BENEFIT_TYPE_KEYS[benefit.benefit_type] || 'otherBenefit')
  const endDate = new Date(benefit.end_date).toLocaleDateString(locale.startsWith('ko') ? 'ko-KR' : 'en-US')
  const isKo = locale.startsWith('ko')
  const countryInfo = sponsor.country_code ? getCountryByCode(sponsor.country_code) : null
  const locationParts = [sponsor.address, sponsor.city, sponsor.region].filter(Boolean)
  const fullAddress = locationParts.length > 0 ? locationParts.join(', ') : null
  const hasContact = !!(sponsor.phone || sponsor.website_url || sponsor.instagram_url || sponsor.facebook_url || sponsor.twitter_url)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center p-4 pb-12">
      {/* 캡처 시 잘리거나 숨겨져도 되는 작은 뒤로가기 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-center">
        <Link
          href={`/${locale}/sponsors/${id}`}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← {isKo ? '매장으로 돌아가기' : 'Back to store'}
        </Link>
      </div>

      {/* 쿠폰 카드 - 캡처용 중앙 배치, 깔끔한 디자인 */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border-2 border-dashed border-emerald-300 p-8 text-center mt-8">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">mytripfy Sponsor</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
          {displayName}
        </h1>
        <div className="my-6 py-4 border-y border-emerald-100">
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600">
            {benefitTitle}
          </p>
          <p className="text-base text-gray-600 mt-2">{benefitLabel}</p>
        </div>
        <p className="text-sm text-gray-500">
          {t('validUntil', { date: endDate })}
        </p>

        {/* 국가 · 주소 · 연락처 */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-2">
          {countryInfo && (
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <CountryFlag code={countryInfo.code} size="sm" />
              <span>{countryInfo.name}{sponsor.city ? ` · ${sponsor.city}` : ''}</span>
            </p>
          )}
          {fullAddress && (
            <p className="text-sm text-gray-600">📍 {fullAddress}</p>
          )}
          {hasContact && (
            <div className="text-xs text-gray-500 space-y-0.5 pt-1 break-all">
              {sponsor.phone && <p>📞 {sponsor.phone}</p>}
              {sponsor.website_url && <p>🔗 {sponsor.website_url}</p>}
              {sponsor.instagram_url && <p>📷 {sponsor.instagram_url}</p>}
              {sponsor.facebook_url && <p>📘 {sponsor.facebook_url}</p>}
              {sponsor.twitter_url && <p>🐦 {sponsor.twitter_url}</p>}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6">
          {isKo ? '매장에서 이 화면을 보여주세요' : 'Show this screen at the store'}
        </p>
      </div>

      <p className="text-[10px] text-gray-300 mt-6">
        mytripfy · {isKo ? '캡처 후 매장에서 사용' : 'Screenshot to use at store'}
      </p>
    </div>
  )
}
