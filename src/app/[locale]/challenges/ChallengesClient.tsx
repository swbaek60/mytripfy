'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CHALLENGES, CATEGORY_LABELS, DIFFICULTY_LABELS, type ChallengeCategory } from '@/data/challenges'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ChallengeCategory[]

// 방문 국가 수 기반으로 자동 완료되는 챌린지 ID
const COUNTRY_COUNT_CHALLENGES: { id: number; threshold: number }[] = [
  { id: 21, threshold: 10 },   // Visit 10 Countries
  { id: 31, threshold: 30 },   // Visit 30 Countries
  { id: 97, threshold: 50 },   // Visit 50 Countries
]

interface Props {
  locale: string
  userId: string | null
  completedIds: number[]
  totalCompleted: number
  earnedPoints: number
  totalPoints: number
  badge: { emoji: string; label: string; color: string }
  visitedCountries: { code: string; name: string; emoji: string }[]
  initialTab: 'challenges' | 'countries'
}

export default function ChallengesClient({
  locale, userId, completedIds, totalCompleted, earnedPoints, totalPoints, badge,
  visitedCountries, initialTab,
}: Props) {
  const router = useRouter()
  const tc = useTranslations('Challenges')
  const [, startTransition] = useTransition()
  const [localCompleted, setLocalCompleted] = useState<Set<number>>(new Set(completedIds))
  const [activeTab, setActiveTab] = useState<'challenges' | 'countries'>(initialTab)
  const [activeCategory, setActiveCategory] = useState<ChallengeCategory | 'all'>('all')
  const [activeDifficulty, setActiveDifficulty] = useState<string>('all')
  const [search, setSearch] = useState('')

  const countryCount = visitedCountries.length

  // 방문 국가 수 기반 자동 완료 챌린지
  const autoCompleted = new Set(
    COUNTRY_COUNT_CHALLENGES
      .filter(c => countryCount >= c.threshold)
      .map(c => c.id)
  )

  // 실제 완료 = 직접 완료 + 자동 완료
  const effectiveCompleted = new Set([...localCompleted, ...autoCompleted])
  const effectiveCount = effectiveCompleted.size
  const progressPct = Math.round((effectiveCount / 100) * 100)

  const filtered = CHALLENGES.filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false
    if (activeDifficulty !== 'all' && c.difficulty !== activeDifficulty) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggle = async (challengeId: number) => {
    if (!userId) { router.push(`/${locale}/login?returnTo=${encodeURIComponent(window.location.pathname)}`); return }
    if (autoCompleted.has(challengeId)) return  // 자동 완료는 토글 불가

    const supabase = createClient()
    const isDone = localCompleted.has(challengeId)
    const next = new Set(localCompleted)
    if (isDone) next.delete(challengeId)
    else next.add(challengeId)
    setLocalCompleted(next)

    startTransition(async () => {
      if (isDone) {
        await supabase.from('user_challenges').delete()
          .eq('user_id', userId).eq('challenge_id', challengeId)
      } else {
        await supabase.from('user_challenges').insert({ user_id: userId, challenge_id: challengeId })
      }
      router.refresh()
    })
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Hero / Progress */}
      <div className="bg-gradient-to-r from-purple to-indigo rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-1">🏆 Bucket List 100</h1>
            <p className="text-white/80 text-sm">Complete travel challenges, earn badges & become a legend.</p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-1">{badge.emoji}</div>
            <div className="text-sm font-bold">{badge.label}</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-sm mb-2">
            <span>{effectiveCount}/100 completed</span>
            <span>{earnedPoints} pts</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div className="bg-surface rounded-full h-3 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="flex gap-3 mt-4 flex-wrap">
          {[
            { at: 1,   emoji: '🌱', label: 'Beginner' },
            { at: 10,  emoji: '🥉', label: 'Bronze' },
            { at: 25,  emoji: '🥈', label: 'Silver' },
            { at: 50,  emoji: '🥇', label: 'Gold' },
            { at: 75,  emoji: '💎', label: 'Diamond' },
            { at: 100, emoji: '👑', label: 'Legend' },
          ].map(m => (
            <div key={m.at}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                effectiveCount >= m.at ? 'bg-surface text-purple' : 'bg-white/20 text-white/60'
              }`}>
              {m.emoji} {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-surface rounded-xl shadow-sm p-1 w-fit">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'challenges' ? 'bg-purple text-white shadow-sm' : 'text-subtle hover:text-body'
          }`}
        >
          🏆 Challenges
        </button>
        <button
          onClick={() => setActiveTab('countries')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'countries' ? 'bg-brand text-white shadow-sm' : 'text-subtle hover:text-body'
          }`}
        >
          🌍 My Countries
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
            activeTab === 'countries' ? 'bg-white/20 text-white' : 'bg-surface-sunken text-body'
          }`}>
            {countryCount}
          </span>
        </button>
      </div>

      {/* ── 챌린지 탭 ── */}
      {activeTab === 'challenges' && (
        <>
          {/* Filters */}
          <div className="space-y-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search challenges..."
              className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple shadow-sm"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setActiveCategory('all')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === 'all' ? 'bg-purple text-white border-purple' : 'bg-surface text-body border-edge hover:border-purple-light'
                }`}>
                All Categories
              </button>
              {ALL_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeCategory === cat ? 'bg-purple text-white border-purple' : 'bg-surface text-body border-edge hover:border-purple-light'
                  }`}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'easy', 'medium', 'hard', 'legendary'].map(d => (
                <button key={d} onClick={() => setActiveDifficulty(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    activeDifficulty === d ? 'bg-footer-border text-white border-footer-border' : 'bg-surface text-subtle border-edge hover:border-subtle'
                  }`}>
                  {d === 'all' ? 'All Levels' : DIFFICULTY_LABELS[d as keyof typeof DIFFICULTY_LABELS].label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-subtle">
            Showing <span className="font-semibold text-body">{filtered.length}</span> challenges
            · <span className="text-success font-semibold">{filtered.filter(c => effectiveCompleted.has(c.id)).length} done</span>
            · <span className="text-hint">{filtered.filter(c => !effectiveCompleted.has(c.id)).length} remaining</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(challenge => {
              const done = effectiveCompleted.has(challenge.id)
              const isAuto = autoCompleted.has(challenge.id)
              const diff = DIFFICULTY_LABELS[challenge.difficulty]
              return (
                <button key={challenge.id} onClick={() => toggle(challenge.id)}
                  disabled={isAuto}
                  className={`text-left rounded-2xl p-4 border-2 transition-all duration-200 ${
                    done
                      ? isAuto
                        ? 'bg-brand-light border-edge-brand shadow-sm cursor-default'
                        : 'bg-success-light border-success shadow-sm'
                      : 'bg-surface border-edge hover:border-purple-light hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`relative text-3xl shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                      done ? (isAuto ? 'bg-brand-muted' : 'bg-success-light') : 'bg-surface-sunken'
                    }`}>
                      {challenge.emoji}
                      {done && (
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${isAuto ? 'bg-brand' : 'bg-success'}`}>
                          <span className="text-white text-[10px] font-bold">{isAuto ? '🌍' : '✓'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold text-sm leading-snug ${done ? (isAuto ? 'text-heading' : 'text-success') : 'text-heading'}`}>
                          {challenge.title}
                        </p>
                        <span className="shrink-0 text-xs font-bold text-purple">+{challenge.points}pts</span>
                      </div>
                      <p className="text-xs text-subtle mt-0.5 leading-relaxed">{challenge.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>
                        {isAuto && <span className="text-[10px] text-brand font-medium">🌍 Auto-completed</span>}
                        <span className="text-[10px] text-hint">#{challenge.id}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-hint">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-sm">No challenges found. Try adjusting filters.</p>
            </div>
          )}
        </>
      )}

      {/* ── My Countries 탭 ── */}
      {activeTab === 'countries' && (
        <div className="space-y-4">
          {/* 국가 수 요약 */}
          <div className="bg-surface rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-heading">🌍 Visited Countries</h2>
                <p className="text-sm text-subtle mt-0.5">
                  <span className="font-bold text-brand">{tc('countriesVisited', { count: countryCount })}</span> {tc('visitComplete')}
                </p>
              </div>
              <Link href={`/${locale}/profile/edit#countries`}>
                <button className="px-4 py-2 bg-brand text-white text-xs font-medium rounded-full hover:bg-brand-hover transition-colors">
                  {tc('addCountry')}
                </button>
              </Link>
            </div>

            {/* 국가 수별 챌린지 자동 완료 현황 */}
            <div className="flex gap-3 flex-wrap mb-4">
              {COUNTRY_COUNT_CHALLENGES.map(c => {
                const challenge = CHALLENGES.find(ch => ch.id === c.id)!
                const achieved = countryCount >= c.threshold
                return (
                  <div key={c.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
                      achieved ? 'bg-brand-light border-edge-brand text-brand-hover' : 'bg-surface-sunken border-edge text-hint'
                    }`}>
                    {challenge.emoji}
                    <span>{challenge.title}</span>
                    {achieved
                      ? <span className="text-brand">✓ Auto-done</span>
                      : <span className="text-hint">({countryCount}/{c.threshold})</span>
                    }
                  </div>
                )
              })}
            </div>

            {/* 나라 도장 */}
            {countryCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visitedCountries.map(vc => (
                  <span key={vc.code}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-light text-heading rounded-full text-sm font-medium border border-edge-brand">
                    <span className="text-base">{vc.emoji}</span>
                    <span>{vc.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-hint">
                <div className="text-5xl mb-3">🗺️</div>
                <p className="text-sm">{tc('noCountriesYet')}</p>
                <Link href={`/${locale}/profile/edit#countries`}>
                  <button className="mt-3 text-brand text-sm hover:underline">
                    {tc('addFirstCountry')}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {!userId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-footer-bg text-white text-sm px-5 py-3 rounded-full shadow-xl">
          <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/challenges`)}`} className="font-medium hover:underline">Log in</Link> to track your challenges 🏆
        </div>
      )}
    </main>
  )
}
