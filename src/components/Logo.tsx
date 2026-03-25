'use client'

import Image from 'next/image'
import { useState } from 'react'

interface LogoProps {
  className?: string
  darkBg?: boolean
}

export default function Logo({ className = '', darkBg = false }: LogoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={`font-bold text-xl tracking-tight drop-shadow-sm ${darkBg ? 'text-white' : 'text-heading'} ${className}`}
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        mytripfy
      </span>
    )
  }

  return (
    <Image
      src="/logo-transparent.png?v=3"
      alt="mytripfy"
      width={893}
      height={287}
      className={`w-auto object-contain ${className}`}
      priority
      onError={() => setFailed(true)}
    />
  )
}
