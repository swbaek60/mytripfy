'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useCurrency } from '@/context/CurrencyContext'
import { CURRENCIES } from '@/utils/currency'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import ModalPortalShell from '@/components/ui/ModalPortalShell'

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

export default function CurrencySelector({
  compact,
  iconOnly,
  onOverlayOpen,
}: {
  compact?: boolean
  iconOnly?: boolean
  onOverlayOpen?: () => void
} = {}) {
  const { selectedCurrency, setSelectedCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)
  const [justChanged, setJustChanged] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])
  useBodyScrollLock(open && mounted)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (!isMobile) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
  }, [open])

  const current = CURRENCIES.find(c => c.code === selectedCurrency) ?? CURRENCIES[0]

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

  const groupedCodes = new Set(CURRENCY_GROUPS.flatMap(g => g.currencies))
  const others = CURRENCIES.filter(c => !groupedCodes.has(c.code))

  const modal = open && mounted ? createPortal(
    <ModalPortalShell onBackdropPointerDown={() => setOpen(false)}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[min(88dvh,calc(100dvh-1.5rem))] sm:h-auto sm:max-h-[min(85vh,92dvh)]">
        <div className="px-6 pt-6 pb-4 border-b border-edge shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-heading">Select Currency</h2>
              <p className="text-xs text-hint mt-0.5">
                Currently: <span className="font-semibold text-brand">{current.symbol} {current.code} — {current.name}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-hint hover:text-body"
            >
              ✕
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hint text-sm">🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search currency (e.g. USD, Euro, ¥...)"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-sunken rounded-xl border border-edge focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-6 py-4 touch-pan-y">
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
                      type="button"
                      key={c.code}
                      onClick={() => { setSelectedCurrency(c.code); setOpen(false); setSearch(''); setJustChanged(true); setTimeout(() => setJustChanged(false), 2000) }}
                      style={{ touchAction: 'manipulation' }}
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
                          type="button"
                          key={c.code}
                          onClick={() => { setSelectedCurrency(c.code); setOpen(false); setSearch(''); setJustChanged(true); setTimeout(() => setJustChanged(false), 2000) }}
                          style={{ touchAction: 'manipulation' }}
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
        <div className="px-6 py-3 border-t border-edge bg-surface-sunken/50 shrink-0">
          <p className="text-xs text-hint text-center">
            Prices are shown in the selected currency
          </p>
        </div>
      </div>
    </ModalPortalShell>,
    document.body
  ) : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          onOverlayOpen?.()
          setOpen(true)
        }}
        className={iconOnly
          ? "w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-body shrink-0 font-semibold text-sm"
          : compact
            ? `flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-sm font-medium ${justChanged ? 'text-success bg-success-light' : 'hover:bg-surface-hover text-body'}`
            : `flex items-center gap-1 text-sm font-medium px-2 py-1.5 rounded-lg transition-colors ${justChanged ? 'text-success bg-success-light' : 'text-subtle hover:text-heading hover:bg-surface-hover'}`
        }
        aria-label="Select currency"
      >
        <span className="font-semibold">{justChanged ? '✓' : current.symbol}</span>
        {!iconOnly && <span className="text-xs">{current.code}</span>}
      </button>
      {modal}
    </div>
  )
}
