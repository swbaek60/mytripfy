'use client'

import { useState } from 'react'
import {
  LOGO_SVG_PRIMARY,
  LOGO_SVG_REVERSE,
  LOGO_WORDMARK_ASPECT,
} from '@/lib/brand/logoAssets'

export type LogoVariant = 'primary' | 'reverse'

interface LogoProps {
  className?: string
  /** 어두운 배경(푸터 등) — reverse 워드마크 */
  variant?: LogoVariant
  /**
   * @deprecated variant="reverse" 사용 권장
   * 예전 PNG를 어둡게 반전시키던 플래그와 동일 의미
   */
  darkBg?: boolean
  /** 헤더 등 LCP: eager 로드 */
  priority?: boolean
}

export default function Logo({
  className = '',
  variant: variantProp,
  darkBg = false,
  priority = false,
}: LogoProps) {
  const [failed, setFailed] = useState(false)
  const variant: LogoVariant =
    variantProp ?? (darkBg ? 'reverse' : 'primary')
  const src = variant === 'reverse' ? LOGO_SVG_REVERSE : LOGO_SVG_PRIMARY

  if (failed) {
    return (
      <span
        className={`font-bold text-xl tracking-tight drop-shadow-sm ${variant === 'reverse' ? 'text-white' : 'text-heading'} ${className}`}
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        mytripfy
      </span>
    )
  }

  const intrinsicH = 25
  const intrinsicW = Math.round(intrinsicH * LOGO_WORDMARK_ASPECT)
  return (
    <img
      src={src}
      alt="mytripfy"
      width={intrinsicW}
      height={intrinsicH}
      className={`block w-auto max-w-full h-auto object-contain object-left ${className}`}
      style={{ aspectRatio: `${intrinsicW} / ${intrinsicH}` }}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )

}
