'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CountrySelect from '@/components/CountrySelect'
import Link from 'next/link'

const BUSINESS_TYPES = ['restaurant', 'cafe', 'bar', 'shop', 'accommodation', 'experience', 'other'] as const
const BENEFIT_TYPES = [
  { value: 'discount_percent', needValue: true, valueLabel: '%' },
  { value: 'discount_fixed', needValue: true, valueLabel: 'Amount' },
  { value: 'free_item', needValue: false },
  { value: 'free_drink', needValue: false },
  { value: 'free_entry', needValue: false },
  { value: 'bogo', needValue: false },
  { value: 'other', needValue: false },
] as const

type BenefitRow = {
  id: string
  dbId?: string
  title: string
  title_en: string
  benefit_type: string
  value_num: string
  value_text: string
  start_date: string
  end_date: string
}

type Sponsor = {
  id: string
  name: string
  name_en?: string | null
  description?: string | null
  description_en?: string | null
  business_type: string
  country_code: string
  region?: string | null
  city?: string | null
  address?: string | null
  website_url?: string | null
  instagram_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  phone?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
}

function toBenefitRow(b: Record<string, unknown>): BenefitRow {
  return {
    id: (b.id as string) || crypto.randomUUID(),
    dbId: b.id as string | undefined,
    title: (b.title as string) || '',
    title_en: (b.title_en as string) || '',
    benefit_type: (b.benefit_type as string) || 'discount_percent',
    value_num: b.value_num != null ? String(b.value_num) : '',
    value_text: (b.value_text as string) || '',
    start_date: (b.start_date as string) || '',
    end_date: (b.end_date as string) || '',
  }
}

function defaultBenefit(): BenefitRow {
  return {
    id: crypto.randomUUID(),
    title: '',
    title_en: '',
    benefit_type: 'discount_percent',
    value_num: '',
    value_text: '',
    start_date: '',
    end_date: '',
  }
}

export default function SponsorEditForm({
  sponsor,
  benefits,
  locale,
}: {
  sponsor: Sponsor
  benefits: Array<Record<string, unknown>>
  locale: string
}) {
  const t = useTranslations('Sponsors')
  const tCommon = useTranslations('Common')
  const tProfileEdit = useTranslations('ProfileEdit')
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(sponsor.name || '')
  const [nameEn, setNameEn] = useState(sponsor.name_en || '')
  const [description, setDescription] = useState(sponsor.description || '')
  const [businessType, setBusinessType] = useState(sponsor.business_type || 'restaurant')
  const [countryCode, setCountryCode] = useState(sponsor.country_code || '')
  const [region, setRegion] = useState(sponsor.region || '')
  const [city, setCity] = useState(sponsor.city || '')
  const [address, setAddress] = useState(sponsor.address || '')
  const [websiteUrl, setWebsiteUrl] = useState(sponsor.website_url || '')
  const [phone, setPhone] = useState(sponsor.phone || '')
  const [instagramUrl, setInstagramUrl] = useState(sponsor.instagram_url || '')
  const [facebookUrl, setFacebookUrl] = useState(sponsor.facebook_url || '')
  const [twitterUrl, setTwitterUrl] = useState(sponsor.twitter_url || '')

  const [removeLogo, setRemoveLogo] = useState(false)
  const [removeCover, setRemoveCover] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const currentLogoUrl = removeLogo ? null : (sponsor.logo_url || null)
  const currentCoverUrl = removeCover ? null : (sponsor.cover_image_url || null)

  const [benefitRows, setBenefitRows] = useState<BenefitRow[]>(() =>
    benefits.length > 0 ? benefits.map(toBenefitRow) : [defaultBenefit()]
  )
  const addBenefit = () => setBenefitRows(prev => [...prev, defaultBenefit()])
  const removeBenefit = (id: string) =>
    setBenefitRows(prev => (prev.length > 1 ? prev.filter(b => b.id !== id) : prev))
  const updateBenefit = (id: string, field: keyof BenefitRow, value: string) => {
    setBenefitRows(prev => prev.map(b => (b.id === id ? { ...b, [field]: value } : b)))
  }
  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const benefitsPayload = benefitRows
        .filter(b => b.title.trim() && b.start_date && b.end_date && b.end_date >= today)
        .map(b => ({
          ...(b.dbId && { id: b.dbId }),
          title: b.title.trim(),
          title_en: b.title_en?.trim() || undefined,
          benefit_type: b.benefit_type,
          value_num: b.value_num ? parseInt(b.value_num, 10) : undefined,
          value_text: b.value_text.trim() || undefined,
          start_date: b.start_date,
          end_date: b.end_date,
        }))

      const form = new FormData()
      form.append('name', name.trim())
      form.append('name_en', nameEn.trim() || '')
      form.append('description', description.trim() || '')
      form.append('business_type', businessType)
      form.append('country_code', countryCode)
      form.append('region', region.trim() || '')
      form.append('city', city.trim() || '')
      form.append('address', address.trim() || '')
      form.append('website_url', websiteUrl.trim() || '')
      form.append('phone', phone.trim() || '')
      form.append('instagram_url', instagramUrl.trim() || '')
      form.append('facebook_url', facebookUrl.trim() || '')
      form.append('twitter_url', twitterUrl.trim() || '')
      form.append('benefits', JSON.stringify(benefitsPayload))
      if (removeLogo) form.append('removeLogo', '1')
      if (removeCover) form.append('removeCover', '1')
      if (logoFile) form.append('logo', logoFile)
      if (coverFile) form.append('cover', coverFile)

      const res = await fetch(`/api/sponsors/${sponsor.id}`, {
        method: 'PATCH',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(`/${locale}/sponsors/${sponsor.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
      <div>
        <Label>Store name *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <Label>Store name (English)</Label>
        <Input value={nameEn} onChange={e => setNameEn(e.target.value)} />
      </div>
      <div>
        <Label>Description</Label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full min-h-[80px] rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <Label>Business type</Label>
        <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          {BUSINESS_TYPES.map(tp => (
            <option key={tp} value={tp}>{t(tp)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Country</Label>
        <div className="mt-1">
          <CountrySelect value={countryCode} onChange={setCountryCode} placeholder="Select country" className="rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Region</Label>
          <Input value={region} onChange={e => setRegion(e.target.value)} />
        </div>
        <div>
          <Label>City</Label>
          <Input value={city} onChange={e => setCity(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Address</Label>
        <Input value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div>
        <Label>{t('website')}</Label>
        <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} type="url" />
      </div>
      <div>
        <Label>{t('phone')}</Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+82 2-1234-5678" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Instagram</Label>
          <Input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} />
        </div>
        <div>
          <Label>Facebook</Label>
          <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} />
        </div>
        <div>
          <Label>Twitter</Label>
          <Input value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>{t('logoImage')}</Label>
        {currentLogoUrl ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <img src={currentLogoUrl} alt="Logo" className="h-16 w-16 rounded-xl border border-gray-200 object-cover" />
            <div className="flex flex-col gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => { setRemoveLogo(true); setLogoFile(null) }} className="rounded-full text-red-600 border-red-200 hover:bg-red-50 w-fit">
                {t('remove')}
              </Button>
              <label className="text-sm text-gray-500 cursor-pointer">
                <span className="inline-block rounded-full border border-emerald-300 px-3 py-1 text-emerald-700 text-xs font-medium hover:bg-emerald-50">
                  {t('replace')}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setRemoveLogo(false) } }} />
              </label>
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setRemoveLogo(false); setLogoFile(f || null) }} className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-50 file:text-emerald-700" />
            {removeLogo && <p className="text-xs text-amber-600 mt-1">{t('logoRemovedOnSave')}</p>}
          </div>
        )}
      </div>

      <div>
        <Label>{t('coverImage')}</Label>
        {currentCoverUrl ? (
          <div className="mt-2 space-y-2">
            <img src={currentCoverUrl} alt="Cover" className="w-full max-h-40 rounded-xl border border-gray-200 object-cover" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setRemoveCover(true); setCoverFile(null) }} className="rounded-full text-red-600 border-red-200 hover:bg-red-50">
                {t('remove')}
              </Button>
              <label className="cursor-pointer">
                <span className="inline-block rounded-full border border-emerald-300 px-3 py-1 text-emerald-700 text-xs font-medium hover:bg-emerald-50">
                  {t('replace')}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setRemoveCover(false) } }} />
              </label>
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setRemoveCover(false); setCoverFile(f || null) }} className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-50 file:text-emerald-700" />
            {removeCover && <p className="text-xs text-amber-600 mt-1">{t('coverRemovedOnSave')}</p>}
          </div>
        )}
      </div>

      <hr className="border-gray-200" />
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{t('benefits')}</h3>
        <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="rounded-full text-emerald-600 border-emerald-300">
          + {t('addBenefit')}
        </Button>
      </div>
      {benefitRows.map((benefit, index) => {
        const meta = BENEFIT_TYPES.find(b => b.value === benefit.benefit_type)
        return (
          <div key={benefit.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">{t('benefit')} #{index + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeBenefit(benefit.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                {t('remove')}
              </Button>
            </div>
            <div>
              <Label>{t('benefitTitle')}</Label>
              <Input value={benefit.title} onChange={e => updateBenefit(benefit.id, 'title', e.target.value)} placeholder="e.g. 10% off for mytripfy users" className="mt-1" />
            </div>
            <div>
              <Label>{t('benefitTitleEn')}</Label>
              <Input value={benefit.title_en} onChange={e => updateBenefit(benefit.id, 'title_en', e.target.value)} placeholder="Optional" className="mt-1" />
            </div>
            <div>
              <Label>{t('benefitType')}</Label>
              <select value={benefit.benefit_type} onChange={e => updateBenefit(benefit.id, 'benefit_type', e.target.value)} className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option value="discount_percent">{t('discountPercent', { value: '' }).replace('{value}', '…')}</option>
                <option value="discount_fixed">{t('discountFixed', { value: '' }).replace('{value}', '…')}</option>
                <option value="free_item">{t('freeItem')}</option>
                <option value="free_drink">{t('freeDrink')}</option>
                <option value="free_entry">{t('freeEntry')}</option>
                <option value="bogo">{t('bogo')}</option>
                <option value="other">{t('otherBenefit')}</option>
              </select>
            </div>
            {meta?.needValue && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Value {meta.valueLabel}</Label>
                  <Input value={benefit.value_num} onChange={e => updateBenefit(benefit.id, 'value_num', e.target.value)} placeholder={meta.valueLabel === '%' ? '10' : '5'} type="text" className="mt-1" />
                </div>
                {benefit.benefit_type === 'discount_fixed' && (
                  <div>
                    <Label>{t('currencyOrValue')}</Label>
                    <Input value={benefit.value_text} onChange={e => updateBenefit(benefit.id, 'value_text', e.target.value)} placeholder="USD, EUR" className="mt-1" />
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('startDate')}</Label>
                <Input value={benefit.start_date} onChange={e => updateBenefit(benefit.id, 'start_date', e.target.value)} type="date" className="mt-1" />
              </div>
              <div>
                <Label>{t('endDate')}</Label>
                <Input value={benefit.end_date} onChange={e => updateBenefit(benefit.id, 'end_date', e.target.value)} type="date" min={today} className="mt-1" />
              </div>
            </div>
          </div>
        )
      })}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
          {saving ? tProfileEdit('saving') : tCommon('save')}
        </Button>
        <Link href={`/${locale}/sponsors/${sponsor.id}`}>
          <Button type="button" variant="outline" className="rounded-full">{tCommon('cancel')}</Button>
        </Link>
      </div>
    </form>
  )
}
