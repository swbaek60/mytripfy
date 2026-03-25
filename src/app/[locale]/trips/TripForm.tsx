'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CountrySelect from '@/components/CountrySelect'

interface TripFormProps {
  userId: string
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

export default function TripForm({ userId, locale, initialTrip }: TripFormProps) {
  const router = useRouter()
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
      setError('Please fill in all required fields.')
      return
    }
    if (endDate < startDate) {
      setError('End date must be after start date.')
      return
    }

    setSaving(true)
    setError('')

    const supabase = createClient()

    if (isEdit && initialTrip) {
      const { error: dbError } = await supabase
        .from('trips')
        .update({
          title,
          destination_country: country || null,
          start_date: startDate,
          end_date: endDate,
          visibility,
          description: description || null,
        })
        .eq('id', initialTrip.id)
        .eq('user_id', userId)

      setSaving(false)
      if (dbError) {
        setError('Failed to update trip. Please try again.')
        return
      }
      router.push(`/${locale}/trips/${initialTrip.id}`)
    } else {
      const { data, error: dbError } = await supabase
        .from('trips')
        .insert({
          user_id: userId,
          title,
          destination_country: country || null,
          start_date: startDate,
          end_date: endDate,
          visibility,
          description: description || null,
        })
        .select()
        .single()

      setSaving(false)
      if (dbError || !data) {
        setError('Failed to save trip. Please try again.')
        return
      }

      router.push(`/${locale}/trips/${data.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">
          {isEdit ? '✏️ Edit Trip Plan' : '🗺️ Create Trip Plan'}
        </h1>
        <p className="text-sm text-subtle mt-1">
          {isEdit
            ? 'Update your itinerary details.'
            : 'Plan your own trip itinerary (private) or share it publicly later.'}
        </p>
      </div>

      {error && (
        <div className="bg-danger-light border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-heading border-b border-edge pb-3">
          Basic Trip Info
        </h2>

        <div className="space-y-1.5">
          <Label>Trip Title <span className="text-danger">*</span></Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. 7 days in Italy (Rome · Florence · Venice)"
            maxLength={120}
          />
          <p className="text-xs text-hint text-right">{title.length}/120</p>
        </div>

        <div className="space-y-1.5">
          <Label>Destination Country (optional)</Label>
          <CountrySelect
            value={country}
            onChange={setCountry}
            placeholder="Select country"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Start Date <span className="text-danger">*</span></Label>
            <Input
              type="date"
              value={startDate}
              min={today}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Date <span className="text-danger">*</span></Label>
            <Input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Visibility</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                visibility === 'private'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface text-body border-edge-strong hover:border-blue-400'
              }`}
            >
              🔒 Private
            </button>
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                visibility === 'public'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface text-body border-edge-strong hover:border-blue-400'
              }`}
            >
              🌍 Public
            </button>
          </div>
          <p className="text-xs text-hint">
            Private trips are only visible to you. Public trips can be shared and discovered by others.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-heading border-b border-edge pb-3">
          Notes / Itinerary (optional)
        </h2>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-edge-strong px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="Rough plan for each day, must-visit spots, activities, restaurants, budget notes, etc."
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-brand hover:bg-brand-hover py-6 text-lg rounded-xl"
      >
        {saving
          ? (isEdit ? 'Saving changes...' : 'Saving trip...')
          : (isEdit ? '💾 Save Changes' : '🚀 Save Trip Plan')}
      </Button>
    </div>
  )
}

