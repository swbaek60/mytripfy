'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// Representative Wikipedia article for each category
const CATEGORY_WIKI: Record<string, string> = {
  countries:    'World',
  attractions:  'Eiffel Tower',
  foods:        'Ramen',
  drinks:       'Bordeaux wine',
  restaurants:  'Noma (restaurant)',
  museums:      'Louvre',
  art_galleries:'Uffizi Gallery',
  nature:       'Grand Canyon',
  animals:      'Lion',
  festivals:    'Rio Carnival',
  islands:      'Bora Bora',
  fishing:      'Fly fishing',
  golf:         'Augusta National Golf Club',
  surfing:      'Banzai Pipeline',
  skiing:       'Chamonix',
  scuba:        'Raja Ampat Islands',
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  countries:    'from-blue-500 to-cyan-500',
  attractions:  'from-amber-500 to-orange-500',
  foods:        'from-red-500 to-rose-500',
  drinks:       'from-purple-600 to-violet-500',
  restaurants:  'from-violet-600 to-purple-500',
  museums:      'from-indigo-600 to-blue-500',
  art_galleries:'from-fuchsia-500 to-purple-600',
  nature:       'from-teal-500 to-green-600',
  animals:      'from-orange-500 to-amber-600',
  festivals:    'from-pink-500 to-rose-600',
  islands:      'from-sky-500 to-cyan-600',
  fishing:      'from-cyan-600 to-teal-700',
  golf:         'from-green-500 to-emerald-600',
  surfing:      'from-blue-600 to-indigo-600',
  skiing:       'from-slate-500 to-blue-400',
  scuba:        'from-blue-700 to-teal-600',
}

let activeReqs = 0
const MAX_CONC = 3
const queue: Array<() => void> = []
function runQueue() {
  while (activeReqs < MAX_CONC && queue.length > 0) {
    const fn = queue.shift()!; activeReqs++; fn()
  }
}

function CategoryCard({
  id, emoji, title, desc, locale, completedCount, totalCount,
}: {
  id: string; emoji: string; title: string; desc: string; locale: string
  completedCount: number; totalCount: number
}) {
  const wikiTitle = CATEGORY_WIKI[id] ?? title
  const gradient = CATEGORY_GRADIENTS[id] ?? 'from-gray-500 to-gray-600'

  const CAT_CACHE_KEY = `cat_img_v4_${id}`
  const [imgUrl, setImgUrl] = useState<string | 'loading' | 'failed'>('loading')

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CAT_CACHE_KEY)
      if (cached) setImgUrl(cached)
    } catch { /* ignore */ }
  }, [CAT_CACHE_KEY])

  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (imgUrl !== 'loading') return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const doFetch = async () => {
        try {
          // Try direct page summary first
          let imgSrc: string | null = null
          const directRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
            { signal: AbortSignal.timeout(6000) }
          )
          if (directRes.ok) {
            const data = await directRes.json()
            imgSrc = data?.thumbnail?.source ?? null
          }

          // Fallback: search API
          if (!imgSrc) {
            const searchRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(wikiTitle)}&format=json&srlimit=1&origin=*`,
              { signal: AbortSignal.timeout(6000) }
            )
            if (searchRes.ok) {
              const searchData = await searchRes.json()
              const firstTitle = searchData?.query?.search?.[0]?.title
              if (firstTitle) {
                const pageRes = await fetch(
                  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`,
                  { signal: AbortSignal.timeout(6000) }
                )
                if (pageRes.ok) {
                  const pageData = await pageRes.json()
                  imgSrc = pageData?.thumbnail?.source ?? null
                }
              }
            }
          }

          if (imgSrc) {
            const hi = imgSrc.replace(/\/\d+px-/, '/800px-')
            setImgUrl(hi)
            try { localStorage.setItem(CAT_CACHE_KEY, hi) } catch { /* ignore */ }
          } else { setImgUrl('failed') }
        } catch { setImgUrl('failed') }
        finally { activeReqs--; runQueue() }
      }
      queue.push(doFetch); runQueue()
    }, { rootMargin: '200px' })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [id, wikiTitle, imgUrl])

  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const showGradient = imgUrl === 'loading' || imgUrl === 'failed'

  return (
    <Link ref={ref} href={`/${locale}/challenges/${id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden h-52 shadow-sm border border-edge hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
        {/* Background */}
        {showGradient ? (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-6xl drop-shadow-lg">{emoji}</span>
          </div>
        ) : (
          <>
            <img
              src={imgUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={() => setImgUrl('failed')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/5" />
          </>
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <span className="text-2xl drop-shadow-lg">{emoji}</span>
            {completedCount > 0 && (
              <span className="bg-purple text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                {completedCount}/100
              </span>
            )}
          </div>

          <div>
            <h3 className="text-white font-extrabold text-lg leading-tight drop-shadow-md">{title}</h3>
            <p className="text-white/75 text-xs mt-0.5 line-clamp-1 drop-shadow">{desc}</p>

            {/* Progress bar */}
            {completedCount > 0 && (
              <div className="mt-2 w-full bg-white/25 rounded-full h-1.5">
                <div
                  className="bg-yellow-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function CategoryCardGrid({
  locale,
  categories,
  completedByCategory,
}: {
  locale: string
  categories: { id: string; emoji: string; title: string; desc: string }[]
  completedByCategory: Record<string, number>
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map(cat => (
        <CategoryCard
          key={cat.id}
          {...cat}
          locale={locale}
          completedCount={completedByCategory[cat.id] ?? 0}
          totalCount={100}
        />
      ))}
    </div>
  )
}

