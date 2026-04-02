'use client'

import { useTranslations } from 'next-intl'
import { useCurrency } from '@/context/CurrencyContext'
import { getCurrency } from '@/utils/currency'

interface Props {
  rate: number | null
  rateCurrency?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export default function GuideRateDisplay({ rate, rateCurrency = 'USD', size = 'sm' }: Props) {
  const tc = useTranslations('Common')
  const { formatPrice, selectedCurrency } = useCurrency()
  const isFree = !rate || rate === 0
  const fromCurrency = rateCurrency || 'USD'
  const cur = getCurrency(fromCurrency)

  if (isFree) {
    const sizeClass = size === 'lg'
      ? 'text-base font-bold text-success'
      : 'text-xs font-semibold text-success'
    return <span className={sizeClass}>FREE</span>
  }

  const converted = formatPrice(rate!, fromCurrency)
  const isSameCurrency = fromCurrency === selectedCurrency

  if (size === 'lg') {
    return (
      <div>
        <span className="text-2xl font-bold text-heading">{converted}</span>
        <span className="text-sm text-subtle">/hr</span>
        {!isSameCurrency && (
          <p className="text-xs text-hint mt-0.5">
            {tc('originalRate')} {cur.symbol}{rate?.toLocaleString()} {fromCurrency}/hr
          </p>
        )}
      </div>
    )
  }

  return (
    <span className="text-xs font-semibold text-brand">
      {converted}/hr
    </span>
  )
}
