'use client'

import { useState, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  avatarUrl: string | null
  photos: string[]
  name: string
  levelBadge: string
  levelNum: number
}

export default function CompanionPosterCarousel({ avatarUrl, photos, name, levelBadge, levelNum }: Props) {
  const slides: string[] = [
    ...(avatarUrl ? [avatarUrl] : []),
    ...photos.filter(p => p && p !== avatarUrl),
  ]

  const [idx, setIdx] = useState(0)
  const total = slides.length
  const hasMultiple = total > 1

  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  const goPrev = useCallback(() => setIdx(i => (i - 1 + total) % total), [total])
  const goNext = useCallback(() => setIdx(i => (i + 1) % total), [total])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }
  const onTouchEnd = () => {
    const dx = touchDeltaX.current
    if (hasMultiple && Math.abs(dx) > 40) dx > 0 ? goPrev() : goNext()
    touchStartX.current = null
    touchDeltaX.current = 0
  }

  return (
    <div
      className="w-full h-full relative overflow-hidden group/poster"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {slides.length > 0 ? (
        slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? name : `${name} photo ${i + 1}`}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 select-none ${
              i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        ))
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/40 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-brand/30 border-2 border-brand/40 flex items-center justify-center">
            <span className="text-4xl font-bold text-brand">
              {(name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* 이전 버튼 */}
      {hasMultiple && (
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); goPrev() }}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center transition-opacity duration-200 hover:bg-black/70 active:scale-95 opacity-100 md:opacity-0 md:group-hover/poster:opacity-100"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 다음 버튼 */}
      {hasMultiple && (
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); goNext() }}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center transition-opacity duration-200 hover:bg-black/70 active:scale-95 opacity-100 md:opacity-0 md:group-hover/poster:opacity-100"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 도트 인디케이터 */}
      {hasMultiple && (
        <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-200 ${
                i === idx ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* 장수 표시 */}
      {hasMultiple && (
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold pointer-events-none">
          {idx + 1}/{total}
        </div>
      )}

      {/* Name + level overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 pointer-events-none">
        <p className="text-white font-semibold text-sm truncate">{name || 'Anonymous'}</p>
        <p className="text-white/70 text-xs">{levelBadge} Lv.{levelNum}</p>
      </div>
    </div>
  )
}
