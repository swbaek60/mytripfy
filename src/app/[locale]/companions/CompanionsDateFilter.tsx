'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, X } from 'lucide-react'

interface Props {
  locale: string
  currentFrom?: string
  currentCountry?: string
  currentPurpose?: string
  currentMood?: string
  currentQuery?: string
  labelFrom: string
  labelClear: string
}

export default function CompanionsDateFilter({
  locale,
  currentFrom,
  currentCountry,
  currentPurpose,
  currentMood,
  currentQuery,
  labelFrom,
  labelClear,
}: Props) {
  const [date, setDate] = useState(currentFrom ?? '')
  const router = useRouter()

  const buildUrl = (fromDate: string) => {
    const p = new URLSearchParams()
    if (currentCountry) p.set('country', currentCountry)
    if (currentPurpose) p.set('purpose', currentPurpose)
    if (currentMood) p.set('mood', currentMood)
    if (currentQuery) p.set('q', currentQuery)
    if (fromDate) p.set('from', fromDate)
    const qs = p.toString()
    return `/${locale}/companions${qs ? `?${qs}` : ''}`
  }

  const handleChange = (val: string) => {
    setDate(val)
    router.push(buildUrl(val))
  }

  const handleClear = () => {
    setDate('')
    router.push(buildUrl(''))
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-edge/60 p-4 mb-4 flex flex-wrap gap-3 items-center">
      <span className="text-sm text-subtle font-medium mr-1 shrink-0 flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4 text-brand" />
        {labelFrom}
      </span>
      <div className="relative">
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          aria-label={labelFrom}
          onChange={e => handleChange(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-sunken text-body border border-edge/60 focus:outline-none focus:border-brand transition-colors cursor-pointer"
        />
      </div>
      {date && (
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-danger-light text-danger-strong hover:bg-danger-muted transition-colors"
        >
          <X className="w-3 h-3" />
          {labelClear}
        </button>
      )}
    </div>
  )
}
