'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CountrySelect from '@/components/CountrySelect'
import { getCitiesForCountry } from '@/data/cities'
import Link from 'next/link'
import PostCoverUpload from '@/components/PostCoverUpload'

const PURPOSES = [
  { value: 'tourism',     label: '🏖️ Tourism' },
  { value: 'backpacking', label: '🎒 Backpacking' },
  { value: 'business',    label: '💼 Business' },
  { value: 'food',        label: '🍜 Food Tour' },
  { value: 'adventure',   label: '🧗 Adventure' },
  { value: 'culture',     label: '🏛️ Culture' },
  { value: 'photography', label: '📷 Photography' },
  { value: 'volunteer',   label: '🤝 Volunteer' },
  { value: 'other',       label: '✈️ Other' },
]

interface InitialData {
  id: string
  title: string
  destination_country: string
  destination_city: string | null
  start_date: string
  end_date: string
  max_people: number
  gender_preference: string
  purpose: string
  description: string | null
  cover_image: string | null
}

export default function CompanionForm({
  userId,
  locale,
  initialData,
}: {
  userId: string
  locale: string
  initialData?: InitialData
}) {
  const router = useRouter()
  const isEdit = !!initialData
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [coverImage, setCoverImage] = useState<string | null>(initialData?.cover_image ?? null)
  const [title, setTitle] = useState(initialData?.title || '')
  const [country, setCountry] = useState(initialData?.destination_country || '')
  const [selectedCities, setSelectedCities] = useState<string[]>(
    initialData?.destination_city ? initialData.destination_city.split(', ') : []
  )
  const [customCity, setCustomCity] = useState('')
  const [startDate, setStartDate] = useState(initialData?.start_date || '')
  const [endDate, setEndDate] = useState(initialData?.end_date || '')
  const [maxPeople, setMaxPeople] = useState(initialData?.max_people || 2)
  const [genderPref, setGenderPref] = useState(initialData?.gender_preference || 'any')
  const [purpose, setPurpose] = useState(initialData?.purpose || 'tourism')
  const [description, setDescription] = useState(initialData?.description || '')

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
    setSelectedCities([]) // 국가 변경 시 도시 선택 초기화
  }

  const handleSubmit = async () => {
    if (!title || !country || !startDate || !endDate) {
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
    const payload = {
      title,
      destination_country: country,
      destination_city: selectedCities.length > 0 ? selectedCities.join(', ') : null,
      start_date: startDate,
      end_date: endDate,
      max_people: maxPeople,
      gender_preference: genderPref,
      purpose,
      description: description || null,
      cover_image: coverImage || null,
    }

    if (isEdit && initialData) {
      const { error: dbError } = await supabase
        .from('companion_posts')
        .update(payload)
        .eq('id', initialData.id)
        .eq('user_id', userId)

      setSaving(false)
      if (dbError) { setError('Failed to update. Please try again.'); return }
      router.push(`/${locale}/companions/${initialData.id}`)
    } else {
      const { data, error: dbError } = await supabase
        .from('companion_posts')
        .insert({ ...payload, user_id: userId, status: 'open' })
        .select()
        .single()

      if (dbError) { setSaving(false); setError('Failed to post. Please try again.'); return }

      // 게시글 생성 시 그룹 채팅방 자동 생성 + 호스트 자동 입장
      const { data: chatData } = await supabase
        .from('chats')
        .insert({
          type: 'trip_group',
          is_group: true,
          name: payload.title,
          reference_id: data.id,
          created_by: userId,
        })
        .select()
        .single()

      if (chatData) {
        // 호스트를 그룹 채팅 참여자로 추가
        await supabase.from('chat_participants').insert({ chat_id: chatData.id, user_id: userId })
        // 게시글에 group_chat_id 연결
        await supabase.from('companion_posts').update({ group_chat_id: chatData.id }).eq('id', data.id)
      }

      setSaving(false)
      router.push(`/${locale}/companions/${data.id}`)
    }
  }

  const handleDelete = async () => {
    if (!initialData) return
    if (!confirm('Are you sure you want to delete this trip post? This cannot be undone.')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase
      .from('companion_posts')
      .delete()
      .eq('id', initialData.id)
      .eq('user_id', userId)
    setDeleting(false)
    router.push(`/${locale}/companions`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading">
            {isEdit ? '✏️ Edit Trip' : '✈️ Post a Trip'}
          </h1>
          <p className="text-sm text-subtle mt-1">
            {isEdit ? 'Update your trip details' : 'Find your perfect travel companion'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-200 text-danger hover:bg-danger-light rounded-full text-xs"
            >
              {deleting ? 'Deleting...' : '🗑️ Delete'}
            </Button>
          )}
          <Link href={isEdit && initialData ? `/${locale}/companions/${initialData.id}` : `/${locale}/companions`}>
            <Button variant="ghost" className="text-subtle">← Back</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-danger-light border border-red-200 text-danger rounded-xl p-4 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Cover Photo */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-3">
        <div>
          <h2 className="font-bold text-heading">Cover Photo</h2>
          <p className="text-xs text-hint mt-0.5">Add a photo to make your post stand out (optional)</p>
        </div>
        <PostCoverUpload
          userId={userId}
          currentUrl={coverImage}
          onUpload={url => setCoverImage(url)}
        />
      </div>

      {/* Title */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-heading border-b border-edge pb-3">Trip Details</h2>

        <div className="space-y-1.5">
          <Label>Post Title <span className="text-danger">*</span></Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Looking for companion for Japan trip in April!"
            maxLength={100}
          />
          <p className="text-xs text-hint text-right">{title.length}/100</p>
        </div>

        <div className="space-y-1.5">
          <Label>Destination Country <span className="text-danger">*</span></Label>
          <CountrySelect
            value={country}
            onChange={handleCountryChange}
            placeholder="Select country"
          />
        </div>

        {/* 도시 선택 (국가 선택 후 표시) */}
        {country && (
          <div className="space-y-2">
            <Label>
              Cities to visit
              <span className="text-hint font-normal text-xs ml-1">(multiple selections allowed)</span>
            </Label>

            {/* 선택된 도시 태그 */}
            {selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-brand-light rounded-xl border border-edge-brand">
                {selectedCities.map(city => (
                  <span
                    key={city}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-full text-sm font-medium"
                  >
                    📍 {city}
                    <button
                      onClick={() => toggleCity(city)}
                      className="hover:text-blue-200 transition-colors ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 주요 도시 버튼 목록 */}
            {availableCities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableCities.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                      selectedCities.includes(city)
                        ? 'bg-brand text-white border-blue-600'
                        : 'bg-surface text-body border-edge hover:border-blue-400 hover:text-brand'
                    }`}
                  >
                    {selectedCities.includes(city) ? '✓ ' : ''}{city}
                  </button>
                ))}
              </div>
            )}

            {/* 직접 입력 (목록에 없는 도시) */}
            <div className="flex gap-2">
              <Input
                value={customCity}
                onChange={e => setCustomCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomCity())}
                placeholder="Can't find your city? Type it here..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomCity}
                disabled={!customCity.trim()}
                className="shrink-0 border-blue-300 text-brand hover:bg-brand-light"
              >
                + Add
              </Button>
            </div>
            <p className="text-xs text-hint">Click a city to select/deselect. Press Enter or click Add for unlisted cities.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Start Date <span className="text-danger">*</span></Label>
            <Input type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Date <span className="text-danger">*</span></Label>
            <Input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-heading border-b border-edge pb-3">Companion Preferences</h2>

        <div className="space-y-1.5">
          <Label>Trip Purpose</Label>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map(p => (
              <button
                key={p.value}
                onClick={() => setPurpose(p.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  purpose === p.value
                    ? 'bg-brand text-white border-blue-600'
                    : 'bg-surface text-body border-edge hover:border-blue-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Gender Preference</Label>
            <select
              value={genderPref}
              onChange={e => setGenderPref(e.target.value)}
              className="w-full h-10 rounded-md border border-edge px-3 text-sm bg-surface"
            >
              <option value="any">👫 Anyone welcome</option>
              <option value="male_only">👨 Male only</option>
              <option value="female_only">👩 Female only</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Number of People (incl. you)</Label>
            <Input
              type="number" min={2} max={20}
              value={maxPeople}
              onChange={e => setMaxPeople(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-heading border-b border-edge pb-3">Description</h2>
        <div className="space-y-1.5">
          <Label>Introduce your trip (optional)</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Share your travel plan, budget range, preferred companion style, accommodation plans, etc."
            rows={5}
            className="w-full rounded-xl border border-edge px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-brand hover:bg-brand-hover py-6 text-lg rounded-xl"
      >
        {saving
          ? (isEdit ? 'Saving...' : 'Posting...')
          : (isEdit ? '💾 Save Changes' : '🚀 Post My Trip')
        }
      </Button>
    </div>
  )
}
