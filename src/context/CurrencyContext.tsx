'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { formatConverted } from '@/utils/currency'

interface CurrencyContextType {
  selectedCurrency: string
  setSelectedCurrency: (code: string) => void
  rates: Record<string, number>
  formatPrice: (amount: number, fromCurrency?: string) => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType>({
  selectedCurrency: 'USD',
  setSelectedCurrency: () => {},
  rates: { USD: 1 },
  formatPrice: (amount) => `$${amount}`,
  isLoading: false,
})

const RATES_CACHE_KEY = 'exchange_rates_cache'
const RATES_TTL_MS = 3600 * 1000

/** localStorage 에 저장된 환율 캐시를 읽는다. 만료·손상 시 null. */
function readCachedRates(): Record<string, number> | null {
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY)
    if (!cached) return null
    const { rates, ts } = JSON.parse(cached) as { rates: Record<string, number>; ts: number }
    if (!rates || new Date().getTime() - ts >= RATES_TTL_MS) return null
    return rates
  } catch {
    return null
  }
}

interface CurrencyState {
  currency: string
  rates: Record<string, number>
  isLoading: boolean
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // 서버 HTML 과 첫 클라이언트 렌더가 일치해야 하므로 localStorage 는
  // 마운트 후에 읽는다. 한 번의 setState 로 합쳐 재렌더를 1회로 제한한다.
  const [{ currency: selectedCurrency, rates, isLoading }, setState] = useState<CurrencyState>({
    currency: 'USD',
    rates: { USD: 1 },
    isLoading: true,
  })

  useEffect(() => {
    const saved = localStorage.getItem('preferred_currency')
    const cachedRates = readCachedRates()

    if (cachedRates) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage 는 하이드레이션 이후에만 읽을 수 있다
      setState({ currency: saved ?? 'USD', rates: cachedRates, isLoading: false })
      return
    }

    let cancelled = false
    fetch('/api/rates')
      .then(r => r.json())
      .then((data: { rates?: Record<string, number> }) => {
        if (cancelled) return
        const next = data.rates ?? { USD: 1 }
        setState({ currency: saved ?? 'USD', rates: next, isLoading: false })
        try {
          localStorage.setItem(
            RATES_CACHE_KEY,
            JSON.stringify({ rates: next, ts: new Date().getTime() })
          )
        } catch {
          /* quota exceeded */
        }
      })
      .catch(() => {
        if (!cancelled) setState(prev => ({ ...prev, currency: saved ?? prev.currency, isLoading: false }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const setSelectedCurrency = useCallback((code: string) => {
    setState(prev => ({ ...prev, currency: code }))
    localStorage.setItem('preferred_currency', code)
  }, [])

  const formatPrice = useCallback(
    (amount: number, fromCurrency = 'USD') =>
      formatConverted(amount, fromCurrency, selectedCurrency, rates),
    [selectedCurrency, rates]
  )

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, rates, formatPrice, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
