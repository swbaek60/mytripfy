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
import LanguageMultiSelect from '@/components/LanguageMultiSelect'
import { getLanguageByCode } from '@/data/languages'

export default function GuideRequestForm({
  userId,
  locale,
}: {
  userId: string
  locale: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [country, setCountry] = useState('')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [customCity, setCustomCity] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([])

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
      setError('Please fill in all required fields.')
      return
    }
    if (endDate < startDate) {
      setError('End date must be after start date.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const supabase = createClient()

      // preferred_languages는 선택된 경우에만 포함 (컬럼 미존재 시 폴백)
      const payload: Record<string, unknown> = {
        user_id: userId,
        title,
        destination_country: country,
        destination_city: selectedCities.length > 0 ? selectedCities.join(', ') : null,
        start_date: startDate,
        end_date: endDate,
        description: description || null,
        cover_image: coverImage || null,
        status: 'open',
      }
      if (preferredLanguages.length > 0) {
        payload.preferred_languages = preferredLanguages
      }

      let { data, error: dbError } = await supabase
        .from('guide_requests')
        .insert(payload)
        .select()
        .single()

      // preferred_languages 컬럼이 없을 경우 해당 필드 제외 후 재시도
      if (dbError && dbError.message?.includes('preferred_languages')) {
        const { preferred_languages: _, ...fallbackPayload } = payload as Record<string, unknown> & { preferred_languages?: unknown }
        const res = await supabase
          .from('guide_requests')
          .insert(fallbackPayload)
          .select()
          .single()
        data = res.data
        dbError = res.error
      }

      if (dbError) {
        setError(`등록 실패: ${dbError.message}`)
        return
      }

      // 매칭 가이드에게 이메일 발송 (비동기, 실패해도 진행)
      fetch('/api/email/guide-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: data!.id }),
      }).catch(console.error)

      router.push(`/${locale}/guides/requests`)
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Post a Guide Request</h2>
        <Link href={`/${locale}/guides/requests`} className="text-sm text-gray-500 hover:text-amber-600">
          ← Back to list
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Trip Details</h3>
        <div className="space-y-1.5">
          <Label>Title <span className="text-red-500">*</span></Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Need a local guide in Seoul for 3 days"
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Destination Country <span className="text-red-500">*</span></Label>
          <CountrySelect
            value={country}
            onChange={handleCountryChange}
            placeholder="Select country"
          />
        </div>

        {country && (
          <div className="space-y-2">
            <Label>Cities (optional)</Label>
            {selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                {selectedCities.map(city => (
                  <span
                    key={city}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-full text-sm font-medium"
                  >
                    {city}
                    <button type="button" onClick={() => toggleCity(city)} className="hover:text-amber-200">×</button>
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
                      selectedCities.includes(city) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'
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
                placeholder="Add city..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCustomCity} disabled={!customCity.trim()} className="shrink-0">
                + Add
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Start Date <span className="text-red-500">*</span></Label>
            <Input type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Date <span className="text-red-500">*</span></Label>
            <Input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Description</h3>
        <div className="space-y-1.5">
          <Label>What do you need from a guide? (optional)</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Preferred language, group size, activities you're interested in, etc."
            rows={5}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 선호 언어 */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-bold text-gray-900">🗣️ Preferred Guide Languages (optional)</h3>
          <p className="text-xs text-gray-500 mt-1">
            가이드가 사용할 수 있으면 좋을 언어를 선택하세요.
            해당 언어를 할 수 있는 가이드에게 우선적으로 알림이 발송됩니다.
          </p>
        </div>
        <LanguageMultiSelect
          value={preferredLanguages}
          onChange={setPreferredLanguages}
          placeholder="🔍 언어 검색 (예: English, Korean...)"
        />
        {preferredLanguages.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
            <span className="text-sm">💡</span>
            <span>
              <strong>{preferredLanguages.map(c => getLanguageByCode(c)?.name).join(', ')}</strong> 가능한 가이드에게 알림이 발송됩니다.
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Cover Image (optional)</h3>
        <PostCoverUpload userId={userId} currentUrl={coverImage} onUpload={setCoverImage} />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-amber-500 hover:bg-amber-600 py-6 text-lg rounded-xl text-white"
      >
        {saving ? 'Posting...' : '🧭 Post Guide Request'}
      </Button>
    </div>
  )
}
