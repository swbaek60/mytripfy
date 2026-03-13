'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { convertAmount, formatCurrency } from '@/utils/currency'

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

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState('USD')
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('preferred_currency')
    if (saved) setSelectedCurrencyState(saved)

    fetch('/api/rates')
      .then(r => r.json())
      .then(data => {
        if (data.rates) setRates(data.rates)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const setSelectedCurrency = useCallback((code: string) => {
    setSelectedCurrencyState(code)
    localStorage.setItem('preferred_currency', code)
  }, [])

  const formatPrice = useCallback(
    (amount: number, fromCurrency = 'USD') => {
      if (!amount) return '—'
      const converted = convertAmount(amount, fromCurrency, selectedCurrency, rates)
      return formatCurrency(converted, selectedCurrency)
    },
    [selectedCurrency, rates]
  )

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, rates, formatPrice, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
