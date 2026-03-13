'use client'

import { useCurrency } from '@/context/CurrencyContext'
import { getCurrency } from '@/utils/currency'

interface Props {
  rate: number | null
  rateCurrency?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export default function GuideRateDisplay({ rate, rateCurrency = 'USD', size = 'sm' }: Props) {
  const { formatPrice, selectedCurrency } = useCurrency()
  const isFree = !rate || rate === 0
  const fromCurrency = rateCurrency || 'USD'
  const cur = getCurrency(fromCurrency)

  if (isFree) {
    const sizeClass = size === 'lg'
      ? 'text-base font-bold text-green-600'
      : 'text-xs font-semibold text-green-600'
    return <span className={sizeClass}>FREE</span>
  }

  const converted = formatPrice(rate!, fromCurrency)
  const isSameCurrency = fromCurrency === selectedCurrency

  if (size === 'lg') {
    return (
      <div>
        <span className="text-2xl font-bold text-gray-900">{converted}</span>
        <span className="text-sm text-gray-500">/hr</span>
        {!isSameCurrency && (
          <p className="text-xs text-gray-400 mt-0.5">
            원래 요금: {cur.symbol}{rate?.toLocaleString()} {fromCurrency}/hr
          </p>
        )}
      </div>
    )
  }

  return (
    <span className="text-xs font-semibold text-blue-600">
      {converted}/hr
    </span>
  )
}
