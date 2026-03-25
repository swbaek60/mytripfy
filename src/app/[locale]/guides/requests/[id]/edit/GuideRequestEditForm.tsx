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

interface Props {
  userId: string
  locale: string
  request: Record<string, unknown>
}

export default function GuideRequestEditForm({ userId, locale, request }: Props) {
  const router = useRouter()
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
      setError('필수 항목을 모두 입력해주세요.')
      return
    }
    if (endDate < startDate) {
      setError('종료일은 시작일 이후여야 합니다.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const supabase = createClient()

      const updatePayload: Record<string, unknown> = {
        title,
        destination_country: country,
        destination_city: selectedCities.length > 0 ? selectedCities.join(', ') : null,
        start_date: startDate,
        end_date: endDate,
        description: description || null,
        cover_image: coverImage || null,
        status,
        updated_at: new Date().toISOString(),
      }
      if (preferredLanguages.length > 0) {
        updatePayload.preferred_languages = preferredLanguages
      }

      let { error: dbError } = await supabase
        .from('guide_requests')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)

      // preferred_languages 컬럼 미존재 시 폴백
      if (dbError && dbError.message?.includes('preferred_languages')) {
        const { preferred_languages: _, ...fallback } = updatePayload as Record<string, unknown> & { preferred_languages?: unknown }
        const res = await supabase
          .from('guide_requests')
          .update(fallback)
          .eq('id', id)
          .eq('user_id', userId)
        dbError = res.error
      }

      if (dbError) {
        setError(`저장 실패: ${dbError.message}`)
        return
      }

      router.push(`/${locale}/guides/requests/${id}`)
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-heading">✏️ Edit Guide Request</h2>
        <Link href={`/${locale}/guides/requests/${id}`} className="text-sm text-subtle hover:text-amber-600">
          ← 돌아가기
        </Link>
      </div>

      {error && (
        <div className="bg-danger-light border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 여행 정보 */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-heading border-b border-edge pb-3">Trip Details</h3>

        <div className="space-y-1.5">
          <Label>Title <span className="text-danger">*</span></Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Need a local guide in Seoul for 3 days"
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Destination Country <span className="text-danger">*</span></Label>
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
                      selectedCities.includes(city)
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-surface text-body border-edge hover:border-amber-400'
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
            <Label>Start Date <span className="text-danger">*</span></Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Date <span className="text-danger">*</span></Label>
            <Input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* 상태 변경 */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <div className="flex gap-2">
            {(['open', 'closed', 'completed'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  status === s
                    ? s === 'open'
                      ? 'bg-success text-white border-success'
                      : s === 'closed'
                        ? 'bg-gray-500 text-white border-gray-500'
                        : 'bg-brand text-white border-brand'
                    : 'bg-surface text-body border-edge hover:border-amber-400'
                }`}
              >
                {s === 'open' ? '🟢 Open' : s === 'closed' ? '⛔ Closed' : '✅ Completed'}
              </button>
            ))}
          </div>
          <p className="text-xs text-hint">Closed / Completed 로 변경하면 새 가이드 신청을 받지 않습니다.</p>
        </div>
      </div>

      {/* 설명 */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-heading border-b border-edge pb-3">Description</h3>
        <div className="space-y-1.5">
          <Label>What do you need from a guide? (optional)</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Preferred language, group size, activities you're interested in, etc."
            rows={5}
            className="w-full rounded-xl border border-edge px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 선호 언어 */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <div className="border-b border-edge pb-3">
          <h3 className="font-bold text-heading">🗣️ Preferred Guide Languages (optional)</h3>
          <p className="text-xs text-subtle mt-1">
            가이드가 사용할 수 있으면 좋을 언어를 선택하세요.
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

      {/* 커버 이미지 */}
      <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-heading border-b border-edge pb-3">Cover Image (optional)</h3>
        <PostCoverUpload userId={userId} currentUrl={coverImage} onUpload={setCoverImage} />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-amber-500 hover:bg-amber-600 py-6 text-lg rounded-xl text-white"
      >
        {saving ? '저장 중...' : '💾 저장하기'}
      </Button>
    </div>
  )
}
