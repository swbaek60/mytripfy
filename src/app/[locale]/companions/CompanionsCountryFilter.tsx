'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import CountryFlag from '@/components/CountryFlag'
import { getCountryByCode } from '@/data/countries'

const INITIAL_COUNT = 20

interface Item {
  code: string
  count: number
}

interface Props {
  list: Item[]
  currentCountry: string | undefined
  locale: string
  purpose?: string
  searchQuery?: string
  labelFilter: string
  labelAll: string
  labelViewAll: string
}

export default function CompanionsCountryFilter({
  list,
  currentCountry,
  locale,
  purpose,
  searchQuery,
  labelFilter,
  labelAll,
  labelViewAll,
}: Props) {
  const selectedNotInTop20 = currentCountry && list.length > INITIAL_COUNT && !list.slice(0, INITIAL_COUNT).some(({ code }) => code === currentCountry)
  const [expanded, setExpanded] = useState(selectedNotInTop20)
  const showAll = expanded || list.length <= INITIAL_COUNT
  const displayed = showAll ? list : list.slice(0, INITIAL_COUNT)
  const hasMore = list.length > INITIAL_COUNT

  const baseHref = (countryCode: string) =>
    `/${locale}/companions?country=${countryCode}${purpose ? `&purpose=${purpose}` : ''}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`

  const allHref = `/${locale}/companions${purpose || searchQuery ? `?${new URLSearchParams([...(purpose ? [['purpose', purpose]] : []), ...(searchQuery ? [['q', searchQuery]] : [])]).toString()}` : ''}`

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-2 items-center">
      <span className="text-sm text-gray-500 font-medium mr-1 shrink-0">{labelFilter}</span>
      <Link href={allHref}>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${!currentCountry ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
          {labelAll}
        </span>
      </Link>
      {displayed.map(({ code, count }) => {
        const info = getCountryByCode(code)
        const isActive = currentCountry === code
        return (
          <Link key={code} href={baseHref(code)}>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
              <CountryFlag code={code} size="sm" className="shrink-0" />
              <span>{info?.name ?? code}</span>
              <span className={isActive ? 'text-blue-200' : 'text-gray-400'}>({count})</span>
            </span>
          </Link>
        )
      })}
      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-200"
          aria-label={labelViewAll}
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>{labelViewAll}</span>
        </button>
      )}
    </div>
  )
}
