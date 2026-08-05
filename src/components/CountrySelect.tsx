'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Search, X } from 'lucide-react'
import { SORTED_COUNTRIES, getCountryByCode } from '@/data/countries'
import CountryFlag from '@/components/CountryFlag'

interface Props {
  value: string
  onChange: (code: string) => void
  placeholder?: string
  className?: string
}

export default function CountrySelect({ value, onChange, placeholder, className = '' }: Props) {
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

  const selected = value ? getCountryByCode(value) : null

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 열 때 검색어를 비우는 일은 토글 시점에 처리한다 (effect 내 setState 회피).
  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const select = (code: string) => {
    onChange(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className="w-full h-10 rounded-md border border-edge px-3 text-sm bg-surface flex items-center gap-2.5 text-left hover:border-edge-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
      >
        {selected ? (
          <>
            <CountryFlag code={selected.code} size="sm" />
            <span className="flex-1 truncate text-heading">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-subtle">{placeholder ?? tc('selectCountry')}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-hint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-surface rounded-xl shadow-lg border border-edge z-50 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-2 border-b border-edge">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hint" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={tc('countrySearchPlaceholder')}
                aria-label={tc('countrySearchPlaceholder')}
                className="w-full pl-8 pr-7 py-2 text-sm rounded-lg border border-edge focus:outline-none focus:ring-2 focus:ring-brand-border"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={tc('clear')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-hint hover:text-body"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 국가 목록 */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => select(c.code)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-brand-light transition-colors text-left ${
                    value === c.code ? 'bg-brand-light text-brand-hover font-medium' : 'text-body'
                  }`}
                >
                  <CountryFlag code={c.code} size="sm" />
                  <span className="flex-1 truncate">{c.name}</span>
                  {value === c.code && <span className="text-brand text-xs">✓</span>}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-hint text-center">{tc('noResults')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
