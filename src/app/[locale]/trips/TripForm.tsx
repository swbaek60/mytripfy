'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { api, errorMessage } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CountrySelect from '@/components/CountrySelect'

interface TripFormProps {
  locale: string
  initialTrip?: {
    id: string
    title: string
    destination_country: string | null
    start_date: string
    end_date: string
    visibility: 'private' | 'public'
    description: string | null
  }
}

export default function TripForm({ locale, initialTrip }: TripFormProps) {
  const router = useRouter()
  const t = useTranslations('Trips')
  const tc = useTranslations('Common')
  const isEdit = !!initialTrip
  const [title, setTitle] = useState(initialTrip?.title ?? '')
  const [country, setCountry] = useState(initialTrip?.destination_country ?? '')
  const [startDate, setStartDate] = useState(initialTrip?.start_date ?? '')
  const [endDate, setEndDate] = useState(initialTrip?.end_date ?? '')
  const [visibility, setVisibility] = useState<'private' | 'public'>(initialTrip?.visibility ?? 'private')
  const [description, setDescription] = useState(initialTrip?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async () => {
    if (!title || !startDate || !endDate) {
      setError(t('fillRequiredFields'))
      return
    }
    if (endDate < startDate) {
      setError(t('endDateAfterStart'))
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title,
      destinationCountry: country || null,
      startDate,
      endDate,
      visibility,
      description: description || null,
    }

    try {
      if (isEdit && initialTrip) {
        await api.patch('/api/trips', { id: initialTrip.id, ...payload })
        router.push(`/${locale}/trips/${initialTrip.id}`)
      } else {
        const { id } = await api.post<{ id: string }>('/api/trips', payload)
        router.push(`/${locale}/trips/${id}`)
      }
    } catch (err) {
      setError(errorMessage(err, t('saveFailed')))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">
          {isEdit ? t('editTitle') : t('createTitle')}
        </h1>
        <p className="text-sm text-subtle mt-1">
          {isEdit ? t('editSubtitle') : t('createSubtitle')}
        </p>
      </div>

      {error && (
        <div className="bg-danger-light border border-danger-border text-danger-strong rounded-xl p-4 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-heading border-b border-edge pb-3">
          {t('basicInfo')}
        </h2>

        <div className="space-y-1.5">
          <Label>{t('tripTitle')} <span className="text-danger">*</span></Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            aria-label={t('tripTitle')}
            maxLength={120}
          />
          <p className="text-xs text-hint text-right">{title.length}/120</p>
        </div>

        <div className="space-y-1.5">
          <Label>{t('destinationCountryOptional')}</Label>
          <CountrySelect value={country} onChange={setCountry} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{tc('startDate')} <span className="text-danger">*</span></Label>
            <Input
              type="date"
              value={startDate}
              min={today}
              aria-label={tc('startDate')}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{tc('endDate')} <span className="text-danger">*</span></Label>
            <Input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{tc('visibility')}</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                visibility === 'private'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface text-body border-edge-strong hover:border-brand'
              }`}
            >
              🔒 {t('private')}
            </button>
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                visibility === 'public'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface text-body border-edge-strong hover:border-brand'
              }`}
            >
              🌍 {t('public')}
            </button>
          </div>
          <p className="text-xs text-hint">{t('visibilityHint')}</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-heading border-b border-edge pb-3">
          {t('notesOptional')}
        </h2>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-edge-strong px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder={t('descriptionPlaceholder')}
          aria-label={t('notesOptional')}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-brand hover:bg-brand-hover py-6 text-lg rounded-xl"
      >
        {saving
          ? tc('saving')
          : (isEdit ? t('saveChanges') : t('saveTripPlan'))}
      </Button>
    </div>
  )
}

