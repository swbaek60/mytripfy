'use client'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/context/CurrencyContext'
import { CURRENCIES } from '@/utils/currency'

// 통화 그룹
const CURRENCY_GROUPS = [
  {
    region: '🌏 Asia Pacific',
    currencies: ['USD','JPY','CNY','KRW','HKD','SGD','TWD','AUD','NZD','INR','IDR','MYR','PHP','THB','VND','BDT','PKR'],
  },
  {
    region: '🌍 Europe',
    currencies: ['EUR','GBP','CHF','SEK','NOK','DKK','PLN','CZK','HUF','RON','BGN','HRK','RUB','UAH','TRY'],
  },
  {
    region: '🌎 Americas',
    currencies: ['CAD','MXN','BRL','ARS','CLP','COP','PEN'],
  },
  {
    region: '🌐 Middle East & Africa',
    currencies: ['AED','SAR','QAR','KWD','BHD','OMR','JOD','ILS','EGP','ZAR','NGN','KES','GHS','MAD'],
  },
]

export default function CurrencySelector({ compact, iconOnly }: { compact?: boolean; iconOnly?: boolean } = {}) {
  const { selectedCurrency, setSelectedCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // 모달 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const current = CURRENCIES.find(c => c.code === selectedCurrency) ?? CURRENCIES[0]

  // 검색 필터
  const filtered = search.trim()
    ? CURRENCY_GROUPS.map(g => ({
        ...g,
        currencies: g.currencies.filter(code => {
          const c = CURRENCIES.find(x => x.code === code)
          if (!c) return false
          return (
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.symbol.includes(search)
          )
        }),
      })).filter(g => g.currencies.length > 0)
    : CURRENCY_GROUPS

  // 그룹에 없는 통화도 표시 (기타)
  const groupedCodes = new Set(CURRENCY_GROUPS.flatMap(g => g.currencies))
  const others = CURRENCIES.filter(c => !groupedCodes.has(c.code))

  return (
    <div className="relative">
      {/* 트리거 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className={iconOnly
          ? "w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-body shrink-0 font-semibold text-sm"
          : compact
            ? "flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors text-sm font-medium text-body"
            : "flex items-center gap-1 text-sm font-medium text-subtle hover:text-heading px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
        }
        aria-label="Select currency"
      >
        <span className="font-semibold">{current.symbol}</span>
        {!iconOnly && <span className="text-xs">{current.code}</span>}
      </button>

      {/* 풀 모달 */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* 패널 */}
          <div className="relative z-10 w-full max-w-lg max-h-[85vh] bg-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

            {/* 헤더 */}
            <div className="px-6 pt-6 pb-4 border-b border-edge">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-heading">Select Currency</h2>
                  <p className="text-xs text-hint mt-0.5">
                    Currently: <span className="font-semibold text-brand">{current.symbol} {current.code} — {current.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-hint hover:text-body"
                >
                  ✕
                </button>
              </div>

              {/* 검색창 */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hint text-sm">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search currency (e.g. USD, Euro, ¥...)"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-sunken rounded-xl border border-edge focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* 통화 목록 */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {filtered.map(group => (
                <div key={group.region}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-1 w-5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" />
                    <span className="text-xs font-semibold text-hint uppercase tracking-wide">
                      {group.region}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.currencies.map(code => {
                      const c = CURRENCIES.find(x => x.code === code)
                      if (!c) return null
                      const isActive = c.code === selectedCurrency
                      return (
                        <button
                          key={c.code}
                          onClick={() => { setSelectedCurrency(c.code); setOpen(false); setSearch('') }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-brand text-white shadow-md shadow-blue-200'
                              : 'hover:bg-surface-hover border border-edge hover:border-edge-brand'
                          }`}
                        >
                          <span className={`text-base font-bold w-6 text-center shrink-0 ${isActive ? 'text-white' : 'text-subtle'}`}>
                            {c.symbol}
                          </span>
                          <div className="min-w-0">
                            <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-heading'}`}>
                              {c.code}
                            </div>
                            <div className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-hint'}`}>
                              {c.name}
                            </div>
                          </div>
                          {isActive && (
                            <span className="ml-auto text-white text-xs shrink-0">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* 기타 통화 (그룹에 없는 것들) */}
              {!search && others.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-1 w-5 rounded-full bg-gradient-to-r from-gray-300 to-gray-400" />
                    <span className="text-xs font-semibold text-hint uppercase tracking-wide">Other</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {others.map(c => {
                      const isActive = c.code === selectedCurrency
                      return (
                        <button
                          key={c.code}
                          onClick={() => { setSelectedCurrency(c.code); setOpen(false); setSearch('') }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-brand text-white shadow-md shadow-blue-200'
                              : 'hover:bg-surface-hover border border-edge hover:border-edge-brand'
                          }`}
                        >
                          <span className={`text-base font-bold w-6 text-center shrink-0 ${isActive ? 'text-white' : 'text-subtle'}`}>
                            {c.symbol}
                          </span>
                          <div className="min-w-0">
                            <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-heading'}`}>{c.code}</div>
                            <div className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-hint'}`}>{c.name}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-10 text-hint">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm">No currency found for &quot;{search}&quot;</p>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-3 border-t border-edge bg-surface-sunken/50">
              <p className="text-xs text-hint text-center">
                Prices are shown in the selected currency
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
