'use client'

import { useState, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CountryFlag from '@/components/CountryFlag'
import BookmarkButton from '@/components/BookmarkButton'

interface Props {
  avatar: string | null
  photos: string[]
  name: string
  levelLabel: string
  levelColor: string
  userId?: string | null
  guideId: string
  isBookmarked?: boolean
  countryCode?: string | null
  countryName?: string | null
  city?: string | null
}

export default function GuidePhotoCarousel({
  avatar,
  photos,
  name,
  levelLabel,
  levelColor,
  userId,
  guideId,
  isBookmarked = false,
  countryCode,
  countryName,
  city,
}: Props) {
  const slides: string[] = [
    ...(avatar ? [avatar] : []),
    ...photos.filter(p => p && p !== avatar),
  ]

  const [idx, setIdx] = useState(0)
  const total = slides.length
  const hasMultiple = total > 1

  // 터치 스와이프 추적
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)
  const didSwipe = useRef(false)   // 스와이프 발생 여부 → click 이벤트 차단에 사용

  const goPrev = useCallback(() => setIdx(i => (i - 1 + total) % total), [total])
  const goNext = useCallback(() => setIdx(i => (i + 1) % total), [total])

  const onArrowClick = useCallback((e: React.MouseEvent, dir: 'prev' | 'next') => {
    e.preventDefault()
    e.stopPropagation()
    dir === 'prev' ? goPrev() : goNext()
  }, [goPrev, goNext])

  // ── 터치 핸들러 ──
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    didSwipe.current = false
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  const onTouchEnd = () => {
    const dx = touchDeltaX.current
    if (hasMultiple && Math.abs(dx) > 40) {
      didSwipe.current = true
      dx > 0 ? goPrev() : goNext()
    }
    touchStartX.current = null
    touchDeltaX.current = 0
    // 짧은 시간 내에 발생하는 click 이벤트를 차단 후 플래그 초기화
    setTimeout(() => { didSwipe.current = false }, 350)
  }

  // 스와이프 후 card Link 이동 방지
  const onWrapperClick = (e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      className="relative w-full aspect-square bg-surface-sunken overflow-hidden shrink-0 group/photo"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onWrapperClick}
    >
      {/* 슬라이드 이미지 */}
      {slides.length > 0 ? (
        slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? name : `${name} photo ${i + 1}`}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 select-none ${
              i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } ${!hasMultiple ? 'group-hover/photo:scale-105 transition-transform duration-300' : ''}`}
          />
        ))
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#D4A853] via-[#E8B960] to-[#F5C563] flex items-center justify-center">
          <span className="text-7xl opacity-90" aria-hidden>🧭</span>
        </div>
      )}

      {/* 하단 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* ← 이전 버튼
          모바일: 항상 표시 (md 미만)
          데스크탑: hover 시에만 표시 */}
      {hasMultiple && (
        <button
          type="button"
          onClick={e => onArrowClick(e, 'prev')}
          aria-label="Previous photo"
          className="
            absolute left-2 top-1/2 -translate-y-1/2 z-20
            w-8 h-8 rounded-full bg-black/50 text-white
            flex items-center justify-center
            transition-opacity duration-200
            hover:bg-black/70 active:scale-95
            opacity-100 md:opacity-0 md:group-hover/photo:opacity-100
          "
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* → 다음 버튼 */}
      {hasMultiple && (
        <button
          type="button"
          onClick={e => onArrowClick(e, 'next')}
          aria-label="Next photo"
          className="
            absolute right-2 top-1/2 -translate-y-1/2 z-20
            w-8 h-8 rounded-full bg-black/50 text-white
            flex items-center justify-center
            transition-opacity duration-200
            hover:bg-black/70 active:scale-95
            opacity-100 md:opacity-0 md:group-hover/photo:opacity-100
          "
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* 도트 인디케이터 */}
      {hasMultiple && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-200 ${
                i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* 우측 상단: 레벨 배지 + 장수 표시 */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-none">
        <span
          className="px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-md"
          style={{ backgroundColor: levelColor }}
        >
          {levelLabel}
        </span>
        {hasMultiple && (
          <span className="px-1.5 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold">
            {idx + 1}/{total}
          </span>
        )}
      </div>

      {/* 좌측 상단: 북마크 */}
      {userId && (
        <div className="absolute top-3 left-3 z-20">
          <BookmarkButton
            userId={userId}
            type="guide"
            referenceId={guideId}
            isBookmarked={isBookmarked}
            size="sm"
          />
        </div>
      )}

      {/* 하단: 활동 지역 */}
      {countryCode && countryName && (
        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex items-center gap-2 min-w-0">
          <CountryFlag code={countryCode} size="sm" className="shrink-0 ring-2 ring-white/80 rounded-sm" />
          <span className="text-white text-sm font-semibold truncate drop-shadow-sm">
            {countryName}{city ? ` · ${city}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}
