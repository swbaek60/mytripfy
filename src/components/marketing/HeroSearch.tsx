'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Sparkles } from 'lucide-react'
import { getCountryCodesMatchingQuery } from '@/data/countries'
import { resolveAliasToEnglish } from '@/data/city-aliases'

interface Props {
  locale: string
  variant?: 'hero' | 'inline'
}

export default function HeroSearch({ locale, variant = 'hero' }: Props) {
  const [where, setWhere] = useState('')
  const router = useRouter()
  const t = useTranslations('Marketing')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    const trimmed = where.trim()
    if (trimmed) {
      const matchingCodes = getCountryCodesMatchingQuery(trimmed)
      if (matchingCodes.length === 1) {
        params.set('country', matchingCodes[0])
      } else {
        // 도시 alias 변환 후 q 파라미터로 전달
        const resolved = resolveAliasToEnglish(trimmed)
        params.set('q', resolved)
      }
    }
    const qs = params.toString()
    router.push(`/${locale}/companions${qs ? `?${qs}` : ''}`)
  }

  const isHero = variant === 'hero'

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div
        className={
          isHero
            ? 'flex gap-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/25 p-2 sm:p-2.5'
            : 'flex gap-2 bg-surface rounded-xl border border-edge p-2 shadow-sm'
        }
      >
        <label className="flex flex-col gap-1 px-3 py-2 rounded-xl hover:bg-surface-sunken/80 transition-colors flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-hint">{t('searchWhere')}</span>
          <input
            type="text"
            value={where}
            onChange={e => setWhere(e.target.value)}
            placeholder={t('searchWherePlaceholder')}
            className="bg-transparent outline-none text-sm font-medium text-heading placeholder:text-hint w-full min-w-0"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl px-6 py-3 min-h-[48px] transition-colors shadow-md shrink-0"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{t('searchButton')}</span>
        </button>
      </div>
      {isHero && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
          <span className="text-white/60">{t('searchHint')}</span>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/personality`)}
            className="inline-flex items-center gap-1.5 text-white/90 hover:text-white font-medium underline-offset-2 hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('tripMatcherCta')}
          </button>
        </div>
      )}
    </form>
  )
}
