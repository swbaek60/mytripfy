'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CountrySelect from '@/components/CountrySelect'

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

export default function SponsorForm({ userId, locale }: { userId: string; locale: string }) {
  const t = useTranslations('Sponsors')
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [businessType, setBusinessType] = useState<string>('restaurant')
  const [countryCode, setCountryCode] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [phone, setPhone] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  type BenefitRow = {
    id: string
    title: string
    benefit_type: string
    value_num: string
    value_text: string
    start_date: string
    end_date: string
  }
  const defaultBenefit = (): BenefitRow => ({
    id: crypto.randomUUID(),
    title: '',
    benefit_type: 'discount_percent',
    value_num: '',
    value_text: '',
    start_date: '',
    end_date: '',
  })
  const [benefits, setBenefits] = useState<BenefitRow[]>([defaultBenefit()])

  const addBenefit = () => setBenefits(prev => [...prev, defaultBenefit()])
  const removeBenefit = (id: string) => setBenefits(prev => prev.length > 1 ? prev.filter(b => b.id !== id) : prev)
  const updateBenefit = (id: string, field: keyof BenefitRow, value: string) => {
    setBenefits(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Store name is required.')
      return
    }
    if (!countryCode) {
      setError('Country is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const form = new FormData()
      form.append('name', name.trim())
      if (nameEn.trim()) form.append('name_en', nameEn.trim())
      if (description.trim()) form.append('description', description.trim())
      if (descriptionEn.trim()) form.append('description_en', descriptionEn.trim())
      form.append('business_type', businessType)
      form.append('country_code', countryCode)
      if (region.trim()) form.append('region', region.trim())
      if (city.trim()) form.append('city', city.trim())
      if (address.trim()) form.append('address', address.trim())
      if (websiteUrl.trim()) form.append('website_url', websiteUrl.trim())
      if (instagramUrl.trim()) form.append('instagram_url', instagramUrl.trim())
      if (facebookUrl.trim()) form.append('facebook_url', facebookUrl.trim())
      if (twitterUrl.trim()) form.append('twitter_url', twitterUrl.trim())
      if (phone.trim()) form.append('phone', phone.trim())
      if (logoFile) form.append('logo', logoFile)
      if (coverFile) form.append('cover', coverFile)

      const benefitsPayload = benefits
        .filter(b => b.title.trim() && b.start_date && b.end_date && b.end_date >= today)
        .map(b => ({
          title: b.title.trim(),
          benefit_type: b.benefit_type,
          value_num: b.value_num ? parseInt(b.value_num, 10) : undefined,
          value_text: b.value_text.trim() || undefined,
          start_date: b.start_date,
          end_date: b.end_date,
        }))
      form.append('benefits', JSON.stringify(benefitsPayload))

      const res = await fetch('/api/sponsors', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(`/${locale}/sponsors/${data.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}

      <div>
        <Label>Store name *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My Café" className="mt-1" required />
      </div>
      <div>
        <Label>Store name (English, optional)</Label>
        <Input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. My Café" className="mt-1" />
      </div>
      <div>
        <Label>Description (optional)</Label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="About your store..." className="w-full mt-1 min-h-[80px] rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <Label>Business type *</Label>
        <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" required>
          {BUSINESS_TYPES.map(tp => (
            <option key={tp} value={tp}>{t(tp)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Country *</Label>
        <div className="mt-1">
          <CountrySelect value={countryCode} onChange={setCountryCode} placeholder="Select country" className="rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Region / State</Label>
          <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. California" className="mt-1" />
        </div>
        <div>
          <Label>City</Label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Seoul" className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Address (for map)</Label>
        <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" className="mt-1" />
      </div>
      <div>
        <Label>{t('website')}</Label>
        <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." type="url" className="mt-1" />
      </div>
      <div>
        <Label>{locale.startsWith('ko') ? '전화번호' : 'Phone'}</Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+82 2-1234-5678" type="tel" className="mt-1" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Instagram</Label>
          <Input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="mt-1" />
        </div>
        <div>
          <Label>Facebook</Label>
          <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className="mt-1" />
        </div>
        <div>
          <Label>Twitter / X</Label>
          <Input value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/..." className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Logo image (optional)</Label>
        <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-50 file:text-emerald-700" />
      </div>
      <div>
        <Label>Cover image (optional)</Label>
        <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-50 file:text-emerald-700" />
      </div>

      <hr className="border-gray-200" />
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{t('benefits')} (optional)</h3>
        <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="rounded-full text-emerald-600 border-emerald-300">
          + Add benefit
        </Button>
      </div>
      {benefits.map((benefit, index) => {
        const meta = BENEFIT_TYPES.find(b => b.value === benefit.benefit_type)
        return (
          <div key={benefit.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Benefit #{index + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeBenefit(benefit.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                Remove
              </Button>
            </div>
            <div>
              <Label>Benefit title</Label>
              <Input value={benefit.title} onChange={e => updateBenefit(benefit.id, 'title', e.target.value)} placeholder="e.g. 10% off for mytripfy users" className="mt-1" />
            </div>
            <div>
              <Label>Benefit type</Label>
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
                    <Label>Currency / text</Label>
                    <Input value={benefit.value_text} onChange={e => updateBenefit(benefit.id, 'value_text', e.target.value)} placeholder="USD, EUR, or amount" className="mt-1" />
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start date</Label>
                <Input value={benefit.start_date} onChange={e => updateBenefit(benefit.id, 'start_date', e.target.value)} type="date" className="mt-1" />
              </div>
              <div>
                <Label>End date</Label>
                <Input value={benefit.end_date} onChange={e => updateBenefit(benefit.id, 'end_date', e.target.value)} type="date" min={today} className="mt-1" />
              </div>
            </div>
          </div>
        )
      })}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
          {saving ? 'Saving...' : 'Create'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-full">Cancel</Button>
      </div>
    </form>
  )
}
