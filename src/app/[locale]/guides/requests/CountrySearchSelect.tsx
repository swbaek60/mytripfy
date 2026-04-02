'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronDown } from 'lucide-react'
import { SORTED_COUNTRIES } from '@/data/countries'
import CountryFlag from '@/components/CountryFlag'
import { useTranslations } from 'next-intl'

interface Props {
  locale: string
  currentCountry?: string
  currentMy?: string
}

export default function CountrySearchSelect({ locale, currentCountry, currentMy }: Props) {
  const router = useRouter()
  const tc = useTranslations('Common')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.trim()
    ? SORTED_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase())
      )
    : SORTED_COUNTRIES

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const select = (code: string) => {
    setOpen(false)
    setQuery('')
    const params = new URLSearchParams()
    if (code !== currentCountry) params.set('country', code)
    if (currentMy) params.set('my', currentMy)
    router.push(`/${locale}/guides/requests${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${open ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-dashed border-edge-strong text-subtle hover:border-amber-300 hover:text-amber-600 bg-surface'}`}
      >
        <Search className="w-3 h-3" />
        More countries
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-1.5 w-64 bg-surface rounded-xl shadow-lg border border-edge z-50 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-2 border-b border-edge">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hint" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type to search (e.g. k, Korea)..."
                className="w-full pl-8 pr-7 py-1.5 text-sm rounded-lg border border-edge focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-hint hover:text-body">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 국가 목록 */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length > 0 ? filtered.map(c => (
              <button
                key={c.code}
                onClick={() => select(c.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-amber-50 transition-colors text-left ${currentCountry === c.code ? 'bg-amber-50 text-amber-700 font-medium' : 'text-body'}`}
              >
                <CountryFlag code={c.code} size="sm" />
                <span className="flex-1 truncate">{c.name}</span>
                {currentCountry === c.code && <span className="text-amber-500 text-xs">✓</span>}
              </button>
            )) : (
              <div className="px-4 py-3 text-sm text-hint text-center">{tc('noResults')}</div>
            )}
          </div>

          {/* 전체 초기화 */}
          {currentCountry && (
            <div className="border-t border-edge p-2">
              <button
                onClick={() => select('')}
                className="w-full text-xs text-red-400 hover:text-danger py-1 flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" /> Clear country filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
