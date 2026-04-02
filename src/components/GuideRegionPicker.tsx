'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { SORTED_COUNTRIES, getCountryByCode } from '@/data/countries'
import { getCitiesForCountry, type GuideRegion } from '@/data/cities'
import CountryFlag from '@/components/CountryFlag'

interface Props {
  value: GuideRegion[]
  onChange: (regions: GuideRegion[]) => void
}

export default function GuideRegionPicker({ value, onChange }: Props) {
  const t = useTranslations('GuideRegion')
  const [countrySearch, setCountrySearch] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const [cityInputs, setCityInputs] = useState<Record<string, string>>({})
  const [cityOpen, setCityOpen] = useState<Record<string, boolean>>({})
  const cityRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const selectedCodes = value.map(r => r.country)

  const filteredCountries = countrySearch.trim()
    ? SORTED_COUNTRIES.filter(c =>
        !selectedCodes.includes(c.code) &&
        (c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
         c.code.toLowerCase().includes(countrySearch.toLowerCase()))
      )
    : []

  const addCountry = (code: string) => {
    if (selectedCodes.includes(code)) return
    onChange([...value, { country: code, cities: [] }])
    setCountrySearch('')
    setCountryOpen(false)
  }

  const removeCountry = (code: string) => {
    onChange(value.filter(r => r.country !== code))
  }

  const addCity = (countryCode: string, city: string) => {
    const trimmed = city.trim()
    if (!trimmed) return
    onChange(value.map(r => {
      if (r.country !== countryCode) return r
      if (r.cities.includes(trimmed)) return r
      return { ...r, cities: [...r.cities, trimmed] }
    }))
    setCityInputs(prev => ({ ...prev, [countryCode]: '' }))
    // 도시 추가 후 드롭다운 유지 (연속 추가를 위해)
    setCityOpen(prev => ({ ...prev, [countryCode]: true }))
  }

  const removeCity = (countryCode: string, city: string) => {
    onChange(value.map(r => {
      if (r.country !== countryCode) return r
      return { ...r, cities: r.cities.filter(c => c !== city) }
    }))
  }

  const getCitySuggestions = (countryCode: string) => {
    const input = cityInputs[countryCode] || ''
    const all = getCitiesForCountry(countryCode)
    const existing = value.find(r => r.country === countryCode)?.cities || []
    if (input.length === 0) {
      return all.filter(c => !existing.includes(c)).slice(0, 10)
    }
    return all.filter(c =>
      !existing.includes(c) &&
      c.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 10)
  }

  return (
    <div className="space-y-4">
      {/* 국가 검색 */}
      <div className="relative">
        <input
          type="text"
          value={countrySearch}
          onChange={e => { setCountrySearch(e.target.value); setCountryOpen(true) }}
          onFocus={() => setCountryOpen(true)}
          onBlur={() => setTimeout(() => setCountryOpen(false), 150)}
          placeholder="Type to search (e.g. k, Korea, Japan)..."
          className="w-full rounded-xl border border-edge px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {countryOpen && (
          <div
            className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface border border-edge rounded-xl shadow-lg max-h-56 overflow-y-auto py-1"
            onMouseDown={e => e.preventDefault()}
          >
            {filteredCountries.length > 0 ? (
              filteredCountries.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => addCountry(c.code)}
                  className="w-full text-left px-4 py-2.5 hover:bg-amber-50 flex items-center gap-2.5 text-sm"
                >
                  <CountryFlag code={c.code} size="sm" />
                  <span className="font-medium">{c.name}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-hint text-center">
                {countrySearch.trim() ? t('noResults') : t('typeToSearch')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 선택된 국가 + 도시 목록 */}
      {value.length === 0 && (
        <p className="text-sm text-hint text-center py-2">
          {t('addCountryHint')}
        </p>
      )}

      <div className="space-y-4">
        {value.map(region => {
          const country = getCountryByCode(region.country)
          const suggestions = getCitySuggestions(region.country)
          const isCityOpen = cityOpen[region.country]
          const cityInput = cityInputs[region.country] || ''

          return (
            <div key={region.country} className="border border-amber-200 rounded-2xl p-4 bg-amber-50/40">
              {/* 국가 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{country?.emoji}</span>
                  <span className="font-bold text-heading">{country?.name || region.country}</span>
                  <span className="text-xs text-hint">({t('citiesCount', { count: region.cities.length })})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCountry(region.country)}
                  className="text-danger hover:text-danger text-sm px-2 py-0.5 rounded hover:bg-danger-light"
                >
                  ✕ {t('remove')}
                </button>
              </div>

              {/* 선택된 도시 뱃지 */}
              {region.cities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {region.cities.map(city => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-1 bg-surface border border-amber-300 text-amber-800 text-xs px-2.5 py-1 rounded-full"
                    >
                      📍 {city}
                      <button
                        type="button"
                        onClick={() => removeCity(region.country, city)}
                        className="ml-0.5 text-amber-500 hover:text-red-500 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 도시 입력 */}
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    ref={el => { cityRefs.current[region.country] = el }}
                    type="text"
                    value={cityInput}
                    onChange={e => {
                      setCityInputs(prev => ({ ...prev, [region.country]: e.target.value }))
                      setCityOpen(prev => ({ ...prev, [region.country]: true }))
                    }}
                    onFocus={() => setCityOpen(prev => ({ ...prev, [region.country]: true }))}
                    onClick={() => setCityOpen(prev => ({ ...prev, [region.country]: true }))}
                    onBlur={() => setTimeout(() => setCityOpen(prev => ({ ...prev, [region.country]: false })), 150)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCity(region.country, cityInput)
                      }
                    }}
                    placeholder={t('cityPlaceholder')}
                    className="flex-1 rounded-xl border border-edge bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <button
                    type="button"
                    onClick={() => addCity(region.country, cityInput)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-xl font-medium shrink-0"
                  >
                    {t('add')}
                  </button>
                </div>

                {/* 도시 자동완성 */}
                {isCityOpen && suggestions.length > 0 && (
                  <div
                    className="absolute z-20 top-full left-0 right-12 mt-1 bg-surface border border-edge rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    onMouseDown={e => e.preventDefault()}
                  >
                    {suggestions.map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => addCity(region.country, city)}
                        className="w-full text-left px-4 py-2 hover:bg-amber-50 text-sm flex items-center gap-2"
                      >
                        <span className="text-amber-500">📍</span> {city}
                      </button>
                    ))}
                    {cityInput.length > 0 && !suggestions.some(s => s.toLowerCase() === cityInput.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => addCity(region.country, cityInput)}
                        className="w-full text-left px-4 py-2 hover:bg-amber-50 text-sm text-amber-700 border-t border-edge flex items-center gap-2"
                      >
                        <span>➕</span> &ldquo;{cityInput}&rdquo; {t('addCustom')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {region.cities.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ {t('addCityHint')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
