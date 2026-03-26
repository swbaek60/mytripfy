'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { SORTED_COUNTRIES, getCountryByCode } from '@/data/countries'
import { LANGUAGES } from '@/data/languages'
import CountryFlag from '@/components/CountryFlag'

interface Props {
  locale: string
  currentFilters: {
    country?: string
    city?: string
    lang?: string
    vehicle?: string
    accommodation?: string
    free?: string
    sort?: string
    q?: string
  }
}

const POPULAR_COUNTRIES = ['JP', 'KR', 'TH', 'VN', 'ID', 'FR', 'IT', 'ES', 'US', 'AU', 'CN', 'TW', 'PH', 'SG', 'MY', 'GB', 'DE', 'CA', 'MX', 'BR']
const POPULAR_LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'th', 'vi', 'id', 'pt', 'ar']

export default function GuidesFilterBar({ locale, currentFilters }: Props) {
  const router = useRouter()
  const t = useTranslations('Guides')
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(currentFilters.q ?? '')
  const [country, setCountry] = useState(currentFilters.country ?? '')
  const [city, setCity] = useState(currentFilters.city ?? '')
  const [lang, setLang] = useState(currentFilters.lang ?? '')
  const [vehicle, setVehicle] = useState(currentFilters.vehicle === '1')
  const [accommodation, setAccommodation] = useState(currentFilters.accommodation === '1')
  const [free, setFree] = useState(currentFilters.free === '1')
  const [sort, setSort] = useState(currentFilters.sort ?? 'rating')
  const [showAdvanced, setShowAdvanced] = useState(
    !!(currentFilters.country || currentFilters.lang || currentFilters.vehicle || currentFilters.accommodation || currentFilters.free)
  )
  const [countrySearch, setCountrySearch] = useState('')

  const selectedCountry = country ? getCountryByCode(country) : null
  const selectedLang = lang ? LANGUAGES.find(l => l.code === lang) : null

  const navigate = useCallback((overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = {
      q, country, city, lang,
      vehicle: vehicle ? '1' : '',
      accommodation: accommodation ? '1' : '',
      free: free ? '1' : '',
      sort,
      ...overrides,
    }
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    startTransition(() => router.push(`/${locale}/guides${params.toString() ? `?${params.toString()}` : ''}`))
  }, [q, country, city, lang, vehicle, accommodation, free, sort, locale, router])

  const handleSearch = () => navigate({})

  const clearAll = () => {
    setQ(''); setCountry(''); setCity(''); setLang('')
    setVehicle(false); setAccommodation(false); setFree(false); setSort('rating')
    startTransition(() => router.push(`/${locale}/guides`))
  }

  const activeCount = [country, lang, vehicle && '1', accommodation && '1', free && '1'].filter(Boolean).length

  const filteredCountries = countrySearch.trim()
    ? SORTED_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : SORTED_COUNTRIES

  return (
    <div className={`bg-surface rounded-2xl shadow-sm mb-6 overflow-hidden transition-opacity ${isPending ? 'opacity-70' : ''}`}>

      {/* ── 검색 + 정렬 바 ── */}
      <div className="p-4 flex flex-col sm:flex-row gap-3">
        {/* 이름 검색 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-edge text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          {q && (
            <button onClick={() => { setQ(''); navigate({ q: '' }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-body">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 정렬 */}
        <div className="relative">
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); navigate({ sort: e.target.value }) }}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-edge text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-surface cursor-pointer"
          >
            <option value="rating">⭐ {t('sortTopRated')}</option>
            <option value="reviews">💬 {t('sortMostReviews')}</option>
            <option value="level">🏆 {t('sortHighestLevel')}</option>
            <option value="newest">🆕 {t('sortNewest')}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hint pointer-events-none" />
        </div>

        {/* 고급 필터 토글 */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showAdvanced ? 'border-gold bg-gold-light text-gold' : 'border-edge text-body hover:bg-surface-hover'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-gold text-white text-xs flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>

        <button
          onClick={handleSearch}
          className="px-5 py-2.5 bg-gold hover:brightness-110 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {t('searchBtn')}
        </button>
      </div>

      {/* ── 고급 필터 패널 ── */}
      {showAdvanced && (
        <div className="border-t border-edge p-4 space-y-4">

          {/* 서비스 토글 */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setVehicle(v => { navigate({ vehicle: !v ? '1' : '' }); return !v }) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${vehicle ? 'bg-brand text-white border-brand' : 'bg-surface border-edge text-body hover:border-blue-300'}`}>
              🚗 {t('filterVehicle')}
            </button>
            <button onClick={() => { setAccommodation(v => { navigate({ accommodation: !v ? '1' : '' }); return !v }) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${accommodation ? 'bg-success text-white border-success' : 'bg-surface border-edge text-body hover:border-green-300'}`}>
              🏠 {t('filterAccommodation')}
            </button>
            <button onClick={() => { setFree(v => { navigate({ free: !v ? '1' : '' }); return !v }) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${free ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface border-edge text-body hover:border-emerald-300'}`}>
              🎁 {t('filterFreeService')}
            </button>
          </div>

          {/* 국가 필터 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-subtle uppercase tracking-wide">🌍 Country</span>
              {country && (
                <button onClick={() => { setCountry(''); setCity(''); navigate({ country: '', city: '' }) }}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            {/* 선택된 국가 표시 */}
            {selectedCountry && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-gold-light border border-gold/20 rounded-xl">
                <CountryFlag code={selectedCountry.code} size="sm" />
                <span className="font-semibold text-gold text-sm">{selectedCountry.name}</span>
                <button onClick={() => { setCountry(''); setCity(''); navigate({ country: '', city: '' }) }}
                  className="ml-auto text-gold hover:opacity-80"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            {/* 국가 검색 */}
            <input
              type="text"
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              placeholder={t('typeToSearchCountry')}
              className="w-full mb-2 px-3 py-2 rounded-xl border border-edge text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            <div className="max-h-52 overflow-y-auto flex flex-wrap gap-1.5">
              {filteredCountries.map(c => (
                <button key={c.code}
                  onClick={() => { setCountry(c.code === country ? '' : c.code); setCity(''); setCountrySearch(''); navigate({ country: c.code === country ? '' : c.code, city: '' }) }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${country === c.code ? 'bg-gold text-white' : 'bg-surface-sunken text-body hover:bg-gold-light'}`}>
                  <CountryFlag code={c.code} size="xs" />
                  {c.name}
                </button>
              ))}
            </div>
            {/* 도시 검색 (국가 선택 시) */}
            {country && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && navigate({})}
                  placeholder={`City in ${selectedCountry?.name ?? country}...`}
                  className="flex-1 px-3 py-2 rounded-xl border border-edge text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
                <button onClick={() => navigate({})} className="px-4 py-2 bg-gold hover:brightness-110 text-white text-sm rounded-xl font-medium">
                  {t('go')}
                </button>
                {city && <button onClick={() => { setCity(''); navigate({ city: '' }) }} className="px-3 py-2 text-hint hover:text-body"><X className="w-4 h-4" /></button>}
              </div>
            )}
          </div>

          {/* 언어 필터 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-subtle uppercase tracking-wide">🗣️ Language</span>
              {lang && (
                <button onClick={() => { setLang(''); navigate({ lang: '' }) }}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {LANGUAGES.filter(l => POPULAR_LANGS.includes(l.code)).sort((a, b) => a.name.localeCompare(b.name)).map(l => (
                <button key={l.code}
                  onClick={() => { setLang(l.code === lang ? '' : l.code); navigate({ lang: l.code === lang ? '' : l.code }) }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${lang === l.code ? 'bg-purple text-white' : 'bg-surface-sunken text-body hover:bg-purple-light'}`}>
                  {l.emoji} {l.name}
                </button>
              ))}
            </div>
            {/* 전체 언어 드롭다운 */}
            <select
              value={lang}
              onChange={e => { setLang(e.target.value); navigate({ lang: e.target.value }) }}
              className="w-full rounded-xl border border-edge px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40"
            >
              <option value="">— {t('allLanguages')} —</option>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.emoji} {l.name}</option>
              ))}
            </select>
          </div>

          {/* 적용 중인 필터 + 전체 초기화 */}
          {activeCount > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-edge">
              <div className="flex flex-wrap gap-1.5">
                {selectedCountry && <span className="flex items-center gap-1 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full"><CountryFlag code={selectedCountry.code} size="xs" />{selectedCountry.name}</span>}
                {city && <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">📍 {city}</span>}
                {selectedLang && <span className="text-xs bg-purple-light text-purple-700 px-2 py-0.5 rounded-full">{selectedLang.emoji} {selectedLang.name}</span>}
                {vehicle && <span className="text-xs bg-brand-muted text-brand-hover px-2 py-0.5 rounded-full">🚗 {t('filterVehicle')}</span>}
                {accommodation && <span className="text-xs bg-success-light text-success px-2 py-0.5 rounded-full">🏠 {t('filterAccommodation')}</span>}
                {free && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">🎁 {t('filterFreeTag')}</span>}
              </div>
              <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1 shrink-0">
                <X className="w-3 h-3" /> {t('clearAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
