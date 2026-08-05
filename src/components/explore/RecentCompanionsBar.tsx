'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getRecentCompanions, type RecentCompanion } from '@/lib/recent-companions'
import { getCountryByCode } from '@/data/countries'

interface Props {
  locale: string
  title: string
}

export default function RecentCompanionsBar({ locale, title }: Props) {
  const [items, setItems] = useState<RecentCompanion[]>([])

  useEffect(() => {
    // 최근 본 목록은 localStorage 에 있어 서버 HTML 과 맞출 수 없다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getRecentCompanions())
  }, [])

  if (items.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-subtle uppercase tracking-wider mb-3">{title}</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map(item => {
          const country = getCountryByCode(item.country)
          return (
            <Link
              key={item.id}
              href={`/${locale}/companions/${item.id}`}
              className="shrink-0 px-4 py-2 rounded-full bg-surface border border-edge text-sm font-medium text-body hover:border-brand hover:text-brand transition-colors"
            >
              {country?.emoji} {item.title.slice(0, 28)}{item.title.length > 28 ? '…' : ''}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
