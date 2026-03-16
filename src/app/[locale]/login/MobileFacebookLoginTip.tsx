'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

/** 모바일에서만 Facebook 로그인 버튼 아래에 안내 문구 표시 (앱으로 열릴 때 대처법) */
export default function MobileFacebookLoginTip() {
  const t = useTranslations('Auth')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () =>
      setIsMobile(
        typeof window !== 'undefined' &&
          (window.matchMedia('(max-width: 768px)').matches || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      )
    check()
    const mql = window.matchMedia('(max-width: 768px)')
    mql.addEventListener('change', check)
    return () => mql.removeEventListener('change', check)
  }, [])

  if (!isMobile) return null

  return (
    <p className="text-xs text-gray-500 mt-1.5 px-1" role="note">
      {t('mobileFacebookTip')}
    </p>
  )
}
