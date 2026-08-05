'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, errorMessage } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CountrySelect from '@/components/CountrySelect'
import { getCitiesForCountry } from '@/data/cities'
import Link from 'next/link'
import PostCoverUpload from '@/components/PostCoverUpload'
import LanguageMultiSelect from '@/components/LanguageMultiSelect'
import { useTranslations } from 'next-intl'

interface Props {
  locale: string
  request: Record<string, unknown>
}

export default function GuideRequestEditForm({ locale, request }: Props) {
  const router = useRouter()
  const t = useTranslations('GuideRequests')
  const tc = useTranslations('Common')
  const id = request.id as string

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [coverImage, setCoverImage] = useState<string | null>((request.cover_image as string) || null)
  const [title, setTitle] = useState((request.title as string) || '')
  const [country, setCountry] = useState((request.destination_country as string) || '')
  const [selectedCities, setSelectedCities] = useState<string[]>(
    (request.destination_city as string)
      ? (request.destination_city as string).split(', ').filter(Boolean)
      : []
  )
  const [customCity, setCustomCity] = useState('')
  const [startDate, setStartDate] = useState((request.start_date as string) || '')
  const [endDate, setEndDate] = useState((request.end_date as string) || '')
  const [description, setDescription] = useState((request.description as string) || '')
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(
    (request.preferred_languages as string[]) || []
  )
  const [status, setStatus] = useState((request.status as string) || 'open')

  const today = new Date().toISOString().split('T')[0]
  const availableCities = getCitiesForCountry(country)

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    )
  }

  const addCustomCity = () => {
    const trimmed = customCity.trim()
    if (trimmed && !selectedCities.includes(trimmed)) {
      setSelectedCities(prev => [...prev, trimmed])
    }
    setCustomCity('')
  }

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    setSelectedCities([])
  }

  const handleSubmit = async () => {
    if (!title || !country || !startDate || !endDate) {
      setError(t('requiredFields'))
      return
    }
    if (endDate < startDate) {
      setError('End date must be after start date.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await api.patch('/api/guide-requests', {
        id,
        title,
        destinationCountry: country,
        destinationCity: selectedCities.length > 0 ? selectedCities.join(', ') : null,
        startDate,
        endDate,
        description: description || null,
        coverImage: coverImage || null,
        preferredLanguages: preferredLanguages.length > 0 ? preferredLanguages : undefined,
        status,
      })
      router.push(`/${locale}/guides/requests/${id}`)
    } catch (err) {
      setError(errorMessage(err, tc('errorSubmit')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-heading">✏️ {t('editTitle')}</h2>
        <Link href={`/${locale}/guides/requests/${id}`} className="text-sm text-subtle hover:text-warning">
          {tc('back')}
        </Link>
      </div>

      {error && (
        <div className="bg-danger-light border border-danger-border text-danger-strong px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 여행 정보 */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-heading border-b border-edge pb-3">{t('tripDetails')}</h3>

        <div className="space-y-1.5">
          <Label>{tc('title')} <span className="text-danger">*</span></Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{tc('destinationCountry')} <span className="text-danger">*</span></Label>
          <CountrySelect value={country} onChange={handleCountryChange} />
        </div>

        {country && (
          <div className="space-y-2">
            <Label>{t('citiesOptional')}</Label>
            {selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-warning-light rounded-xl border border-warning-muted">
                {selectedCities.map(city => (
                  <span
                    key={city}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-warning-strong text-white rounded-full text-sm font-medium"
                  >
                    {city}
                    <button type="button" onClick={() => toggleCity(city)} aria-label={`${tc('remove')} ${city}`} className="hover:text-warning-border">×</button>
                  </span>
                ))}
              </div>
            )}
            {availableCities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableCities.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      selectedCities.includes(city)
                        ? 'bg-warning-strong text-white border-warning'
                        : 'bg-surface text-body border-edge hover:border-warning'
                    }`}
                  >
                    {selectedCities.includes(city) ? '✓ ' : ''}{city}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={customCity}
                onChange={e => setCustomCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomCity())}
                placeholder={tc('addCity')}
                aria-label={tc('addCity')}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCustomCity} disabled={!customCity.trim()} className="shrink-0">
                + {tc('add')}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{tc('startDate')} <span className="text-danger">*</span></Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{tc('endDate')} <span className="text-danger">*</span></Label>
            <Input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* 상태 변경 */}
        <div className="space-y-1.5">
          <Label>{t('status')}</Label>
          <div className="flex gap-2">
            {(['open', 'closed', 'completed'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  status === s
                    ? s === 'open'
                      ? 'bg-success-strong text-white border-success'
                      : s === 'closed'
                        ? 'bg-subtle text-white border-edge-strong'
                        : 'bg-brand text-white border-brand'
                    : 'bg-surface text-body border-edge hover:border-warning'
                }`}
              >
                {s === 'open' ? `🟢 ${t('statusOpen')}` : s === 'closed' ? `⛔ ${t('statusClosed')}` : `✅ ${t('statusCompleted')}`}
              </button>
            ))}
          </div>
          <p className="text-xs text-hint">{t('statusChangeNote')}</p>
        </div>
      </div>

      {/* 설명 */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-heading border-b border-edge pb-3">{t('description')}</h3>
        <div className="space-y-1.5">
          <Label>{t('descHint')}</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Preferred language, group size, activities you're interested in, etc."
            rows={5}
            className="w-full rounded-xl border border-edge px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warning"
          />
        </div>
      </div>

      {/* 선호 언어 */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <div className="border-b border-edge pb-3">
          <h3 className="font-bold text-heading">🗣️ {t('preferredLangsTitle')}</h3>
          <p className="text-xs text-subtle mt-1">
            {t('preferredLangsDesc')}
          </p>
        </div>
        <LanguageMultiSelect
          value={preferredLanguages}
          onChange={setPreferredLanguages}
          placeholder={tc('searchLanguage')}
        />
        {preferredLanguages.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-warning-light rounded-xl border border-warning-muted text-xs text-warning-strong">
            <span className="text-sm">💡</span>
            <span>
              {t('langNotificationHint')}
            </span>
          </div>
        )}
      </div>

      {/* 커버 이미지 */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-heading border-b border-edge pb-3">{t('coverImage')}</h3>
        <PostCoverUpload currentUrl={coverImage} onUpload={setCoverImage} />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-warning-strong hover:bg-warning py-6 text-lg rounded-xl text-white"
      >
        {saving ? tc('saving') : `💾 ${tc('save')}`}
      </Button>
    </div>
  )
}
