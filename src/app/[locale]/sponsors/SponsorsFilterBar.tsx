'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SORTED_COUNTRIES, getCountryByCode } from '@/data/countries'
import CountryFlag from '@/components/CountryFlag'
import { useCallback, useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

const TYPES = ['restaurant', 'cafe', 'bar', 'shop', 'accommodation', 'experience', 'other'] as const

export default function SponsorsFilterBar({
  currentCountry,
  currentType,
  currentQ,
}: {
  locale: string
  currentCountry?: string
  currentType?: string
  currentQ?: string
}) {
  const t = useTranslations('Sponsors')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(currentQ ?? '')
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const countryRef = useRef<HTMLDivElement>(null)
  const countryInputRef = useRef<HTMLInputElement>(null)

  const filteredCountriesForFilter = countryQuery.trim()
    ? SORTED_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countryQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(countryQuery.toLowerCase())
      )
    : SORTED_COUNTRIES

  const setFilter = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '')
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`${pathname}?${next.toString()}`)
  }, [pathname, router, searchParams])

  const submitSearch = () => {
    setFilter('q', q.trim() || null)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (countryOpen) {
      setCountryQuery('')
      setTimeout(() => countryInputRef.current?.focus(), 50)
    }
  }, [countryOpen])

  const selectedCountry = currentCountry ? getCountryByCode(currentCountry) : null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <input
        type="search"
        placeholder={t('searchPlaceholder')}
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submitSearch()}
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 w-44"
      />
      <button type="button" onClick={submitSearch} className="text-sm px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
        {t('searchBtn')}
      </button>
      <div ref={countryRef} className="relative">
        <button
          type="button"
          onClick={() => setCountryOpen(v => !v)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 flex items-center gap-2 min-w-[140px]"
        >
          {selectedCountry ? (
            <>
              <CountryFlag code={selectedCountry.code} size="sm" />
              <span className="truncate">{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-500">{t('filterCountry')} · {t('allTypes')}</span>
          )}
          <ChevronDown className={`w-4 h-4 shrink-0 ml-auto transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
        </button>
        {countryOpen && (
          <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden min-w-[220px]">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={countryInputRef}
                  type="text"
                  value={countryQuery}
                  onChange={e => setCountryQuery(e.target.value)}
                  placeholder="Type to search (e.g. k, Korea)..."
                  className="w-full pl-8 pr-7 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                {countryQuery && (
                  <button type="button" onClick={() => setCountryQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { setFilter('country', null); setCountryOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 text-left ${!currentCountry ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}`}
              >
                <span className="w-5 h-[15px] flex items-center justify-center text-xs text-gray-400">—</span>
                {t('filterCountry')} · {t('allTypes')}
              </button>
              {filteredCountriesForFilter.length > 0 ? (
                filteredCountriesForFilter.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { setFilter('country', c.code); setCountryOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 text-left ${currentCountry === c.code ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}`}
                  >
                    <CountryFlag code={c.code} size="sm" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setFilter('type', '')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${!currentType ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {t('allTypes')}
        </button>
        {TYPES.map(tp => (
          <button
            key={tp}
            type="button"
            onClick={() => setFilter('type', currentType === tp ? '' : tp)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${currentType === tp ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t(tp)}
          </button>
        ))}
      </div>
    </div>
  )
}
