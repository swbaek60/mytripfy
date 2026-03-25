'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getCountryCodesMatchingQuery } from '@/data/countries'

interface Props {
  locale: string
}

export default function HomeSearch({ locale }: Props) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const tSection = useTranslations('HomeSection')
  const tCommon = useTranslations('Common')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const matchingCodes = getCountryCodesMatchingQuery(trimmed)
    if (matchingCodes.length === 1) {
      router.push(`/${locale}/companions?country=${matchingCodes[0]}`)
    } else if (matchingCodes.length > 1) {
      router.push(`/${locale}/companions?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push(`/${locale}/companions?q=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto">
      <div className="flex items-center bg-white/95 backdrop-blur rounded-xl sm:rounded-2xl shadow-2xl shadow-black/30 p-2 sm:p-1.5 gap-2">
        <span className="pl-2 sm:pl-4 text-lg sm:text-xl shrink-0" aria-hidden>🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`${tSection('searchPlaceholderPrefix')} (e.g. France, Bangkok)`}
          className="flex-1 min-w-0 py-3 sm:py-3 px-2 text-heading placeholder-hint bg-transparent outline-none text-sm sm:text-base font-medium"
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:opacity-90 text-white font-bold px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl transition-all shadow-md shrink-0 text-sm sm:text-base min-h-[44px] touch-manipulation"
        >
          {tCommon('search')}
        </button>
      </div>
      <p className="text-blue-300/70 text-xs mt-2 sm:mt-2.5 text-center px-1">
        {tSection('searchHintPrefix')} Japan · Thailand · Italy · Seoul · London
      </p>
    </form>
  )
}
