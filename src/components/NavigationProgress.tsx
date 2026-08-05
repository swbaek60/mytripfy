'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function NavigationProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const prevUrl = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fakeProgressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (fakeProgressRef.current) clearInterval(fakeProgressRef.current)
  }

  const startLoading = () => {
    clear()
    setVisible(true)
    setBarWidth(15)
    let w = 15
    fakeProgressRef.current = setInterval(() => {
      w = w + (90 - w) * 0.12
      setBarWidth(Math.min(w, 88))
    }, 300)
  }

  const finishLoading = () => {
    clear()
    setBarWidth(100)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setBarWidth(0)
    }, 350)
  }

  // 경로 변경 완료 → 로딩 종료
  useEffect(() => {
    const current = pathname + searchParams.toString()
    if (prevUrl.current && current !== prevUrl.current) {
      finishLoading()
    }
    prevUrl.current = current
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // 전역 클릭 감지 → 내부 링크 클릭 시 로딩 시작
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 버튼 내부 클릭이면 페이지 이동이 아니므로 무시
      if ((e.target as Element).closest('button')) return
      const link = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute('href') ?? ''
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.target === '_blank' ||
        e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
      ) return

      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        const destUrl = url.pathname + url.search
        const curUrl = window.location.pathname + window.location.search
        if (destUrl !== curUrl) {
          startLoading()
        }
      } catch {
        // 파싱 실패 무시
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => clear(), [])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-gradient-to-r from-brand via-purple to-brand shadow-[0_0_8px_rgba(99,102,241,0.7)] transition-[width] duration-300 ease-out"
      style={{ width: `${barWidth}%` }}
    />
  )
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}
