'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Sparkles } from 'lucide-react'
import { getCountryCodesMatchingQuery } from '@/data/countries'

const VIBES = [
  { id: 'adventurer', emoji: '🧗' },
  { id: 'culture_seeker', emoji: '🏛️' },
  { id: 'social_nomad', emoji: '🥳' },
  { id: 'backpacker', emoji: '🎒' },
  { id: 'foodie_explorer', emoji: '🍜' },
  { id: 'luxury_traveler', emoji: '💎' },
] as const

interface Props {
  locale: string
  variant?: 'hero' | 'inline'
}

export default function HeroSearch({ locale, variant = 'hero' }: Props) {
  const [where, setWhere] = useState('')
  const [when, setWhen] = useState('')
  const [vibe, setVibe] = useState('')
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
        params.set('q', trimmed)
      }
    }
    if (when) params.set('from', when)
    if (vibe) params.set('vibe', vibe)
    const qs = params.toString()
    router.push(`/${locale}/companions${qs ? `?${qs}` : ''}`)
  }

  const isHero = variant === 'hero'

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
      <div
        className={
          isHero
            ? 'grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/25 p-2 sm:p-2.5'
            : 'grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 bg-surface rounded-xl border border-edge p-2 shadow-sm'
        }
      >
        <label className="flex flex-col gap-1 px-3 py-2 rounded-xl hover:bg-surface-sunken/80 transition-colors">
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
        <label className="flex flex-col gap-1 px-3 py-2 rounded-xl hover:bg-surface-sunken/80 transition-colors border-t sm:border-t-0 sm:border-l border-edge/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-hint">{t('searchWhen')}</span>
          <input
            type="date"
            value={when}
            onChange={e => setWhen(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium text-heading w-full min-w-0"
          />
        </label>
        <label className="flex flex-col gap-1 px-3 py-2 rounded-xl hover:bg-surface-sunken/80 transition-colors border-t sm:border-t-0 sm:border-l border-edge/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-hint">{t('searchVibe')}</span>
          <select
            value={vibe}
            onChange={e => setVibe(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium text-heading w-full min-w-0 cursor-pointer"
          >
            <option value="">{t('searchVibeAny')}</option>
            {VIBES.map(v => (
              <option key={v.id} value={v.id}>
                {v.emoji} {t(`vibe_${v.id}` as 'vibe_adventurer')}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl px-6 py-3 sm:py-0 min-h-[48px] transition-colors shadow-md"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">{t('searchButton')}</span>
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
