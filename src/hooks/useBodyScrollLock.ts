'use client'

import { useEffect, useRef } from 'react'

/**
 * 풀스크린 모달용 body 스크롤 잠금 (iOS Safari 포함).
 * 잠금 해제 후 이중 rAF로 scroll 복원 — 주소창 리사이즈 후에도 위치 어긋남 완화.
 */
export function useBodyScrollLock(locked: boolean) {
  const scrollYRef = useRef(0)

  useEffect(() => {
    if (!locked) return

    scrollYRef.current = window.scrollY ?? document.documentElement.scrollTop ?? 0
    const html = document.documentElement
    const prevHtmlOverflow = html.style.overflow
    const gap = Math.max(0, window.innerWidth - html.clientWidth)

    html.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYRef.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`

    return () => {
      html.style.overflow = prevHtmlOverflow
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      const y = scrollYRef.current
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, y)
        })
      })
    }
  }, [locked])
}
