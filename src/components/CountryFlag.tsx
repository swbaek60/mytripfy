'use client'

import { useState } from 'react'

interface Props {
  code: string        // ISO 2자리 (JP, KR, ...)
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  xs: { w: 16, h: 12, cls: 'w-4 h-3' },
  sm: { w: 20, h: 15, cls: 'w-5 h-[15px]' },
  md: { w: 24, h: 18, cls: 'w-6 h-[18px]' },
  lg: { w: 32, h: 24, cls: 'w-8 h-6' },
}

export default function CountryFlag({ code, size = 'sm', className = '' }: Props) {
  const [error, setError] = useState(false)
  const { w, h, cls } = sizeMap[size]
  const lower = code.toLowerCase()

  if (error) {
    // 이미지 로드 실패 시 이모지 fallback
    return <span>{String.fromCodePoint(
      0x1F1E6 + (code.charCodeAt(0) - 65),
      0x1F1E6 + (code.charCodeAt(1) - 65)
    )}</span>
  }

  return (
    <img
      src={`https://flagcdn.com/${w}x${h}/${lower}.png`}
      srcSet={`https://flagcdn.com/${w * 2}x${h * 2}/${lower}.png 2x`}
      width={w}
      height={h}
      alt={code}
      onError={() => setError(true)}
      className={`${cls} object-cover rounded-[2px] shadow-sm flex-shrink-0 ${className}`}
    />
  )
}
