'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X, Images } from 'lucide-react'

interface Props {
  avatar: string | null
  photos: string[]   // profile_photos
  name: string
}

export default function GuideHeroGallery({ avatar, photos, name }: Props) {
  // avatar + 추가 사진 합치기 (중복 제거)
  const all: string[] = [
    ...(avatar ? [avatar] : []),
    ...photos.filter(p => p && p !== avatar),
  ]

  const [lightbox, setLightbox] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const openLightbox = (i: number) => setLightbox(i)
  const closeLightbox = () => setLightbox(null)

  const prev = useCallback(() => {
    setLightbox(i => i === null ? null : (i - 1 + all.length) % all.length)
  }, [all.length])

  const next = useCallback(() => {
    setLightbox(i => i === null ? null : (i + 1) % all.length)
  }, [all.length])

  useEffect(() => {
    if (lightbox === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  if (all.length === 0) {
    return (
      <div className="w-full h-48 sm:h-64 bg-gradient-to-r from-[#D4A853] via-[#E8B960] to-[#F5C563] rounded-2xl flex items-center justify-center">
        <span className="text-7xl opacity-70">🧭</span>
      </div>
    )
  }

  // 그리드 레이아웃: 사진 수에 따라 다르게
  const shown = all.slice(0, 5)
  const extra = all.length - 5

  const imgClass = 'w-full h-full object-cover cursor-pointer hover:brightness-90 transition-all duration-200'

  const renderGrid = () => {
    if (shown.length === 1) {
      return (
        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden">
          <img src={shown[0]} alt={name} className={imgClass} onClick={() => openLightbox(0)} />
        </div>
      )
    }

    if (shown.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1.5 aspect-[16/9] rounded-2xl overflow-hidden">
          {shown.map((src, i) => (
            <div key={i} className="overflow-hidden">
              <img src={src} alt={`${name} ${i + 1}`} className={imgClass} onClick={() => openLightbox(i)} />
            </div>
          ))}
        </div>
      )
    }

    if (shown.length === 3) {
      return (
        <div className="grid grid-cols-3 gap-1.5 aspect-[16/9] rounded-2xl overflow-hidden">
          {/* 왼쪽 대형 */}
          <div className="col-span-2 overflow-hidden">
            <img src={shown[0]} alt={name} className={imgClass} onClick={() => openLightbox(0)} />
          </div>
          {/* 오른쪽 2장 */}
          <div className="grid grid-rows-2 gap-1.5">
            {shown.slice(1).map((src, i) => (
              <div key={i} className="overflow-hidden">
                <img src={src} alt={`${name} ${i + 2}`} className={imgClass} onClick={() => openLightbox(i + 1)} />
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (shown.length === 4) {
      return (
        <div className="grid grid-cols-3 gap-1.5 aspect-[16/9] rounded-2xl overflow-hidden">
          <div className="col-span-2 overflow-hidden">
            <img src={shown[0]} alt={name} className={imgClass} onClick={() => openLightbox(0)} />
          </div>
          <div className="grid grid-rows-3 gap-1.5">
            {shown.slice(1).map((src, i) => (
              <div key={i} className="overflow-hidden">
                <img src={src} alt={`${name} ${i + 2}`} className={imgClass} onClick={() => openLightbox(i + 1)} />
              </div>
            ))}
          </div>
        </div>
      )
    }

    // 5장 이상: 2열 레이아웃 (왼쪽 크게 + 오른쪽 2x2)
    return (
      <div className="grid grid-cols-3 gap-1.5 aspect-[16/9] rounded-2xl overflow-hidden">
        {/* 메인 */}
        <div className="col-span-2 overflow-hidden">
          <img src={shown[0]} alt={name} className={imgClass} onClick={() => openLightbox(0)} />
        </div>
        {/* 오른쪽 2x2 */}
        <div className="grid grid-cols-2 grid-rows-2 gap-1.5">
          {shown.slice(1, 5).map((src, i) => (
            <div key={i} className="overflow-hidden relative">
              <img src={src} alt={`${name} ${i + 2}`} className={imgClass} onClick={() => openLightbox(i + 1)} />
              {/* 마지막 셀에 +N 오버레이 */}
              {i === 3 && extra > 0 && (
                <button
                  onClick={() => openLightbox(4)}
                  className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white gap-0.5 hover:bg-black/65 transition-colors"
                >
                  <Images className="w-5 h-5 opacity-90" />
                  <span className="text-lg font-bold">+{extra}</span>
                  <span className="text-xs opacity-80">more</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        {renderGrid()}
        {/* 전체 사진 수 뱃지 */}
        {all.length > 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/75 text-white text-xs font-semibold rounded-full backdrop-blur-sm transition-colors"
          >
            <Images className="w-3.5 h-3.5" />
            {all.length} photos
          </button>
        )}
      </div>

      {/* ── 라이트박스 ── */}
      {lightbox !== null && mounted && createPortal(
        <div
          className="fixed inset-0 z-[10100] bg-white flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* 닫기 */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/8 hover:bg-black/15 text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 카운터 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-500 text-sm font-medium">
            {lightbox + 1} / {all.length}
          </div>

          {/* 이전 */}
          {all.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-3 sm:left-6 z-10 w-11 h-11 rounded-full bg-black/8 hover:bg-black/15 text-gray-700 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* 이미지 */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={all[lightbox]}
              alt={`${name} photo ${lightbox + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-lg select-none"
              draggable={false}
            />
          </div>

          {/* 다음 */}
          {all.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-3 sm:right-6 z-10 w-11 h-11 rounded-full bg-black/8 hover:bg-black/15 text-gray-700 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* 썸네일 스트립 */}
          {all.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
              {all.map((src, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox(i) }}
                  className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === lightbox ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300 opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
