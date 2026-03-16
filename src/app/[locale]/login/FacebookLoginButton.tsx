'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  locale: string
}

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export default function FacebookLoginButton({ locale }: Props) {
  const router = useRouter()
  const popupRef = useRef<Window | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [loading, setLoading] = useState(false)

  // postMessage 수신: 팝업/새 탭에서 OAuth 완료 신호를 받으면 페이지 이동
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'FACEBOOK_AUTH_COMPLETE') return
      const allowedOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      if (allowedOrigin && event.origin !== allowedOrigin) return
      cleanup()
      if (event.data.success) {
        // 선택한 언어 유지: 콜백의 locale은 Supabase 리다이렉트에서 빠질 수 있으므로 부모(현재 페이지) locale 사용
        router.push(`/${locale}`)
        router.refresh()
      } else {
        router.push(`/${locale}/login?message=Login+was+interrupted.+Please+try+again.`)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [locale, router])

  function cleanup() {
    setLoading(false)
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null
  }

  async function handleClick() {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/auth/facebook-url?locale=${locale}`)
      const json = await res.json()
      if (!json.url) throw new Error('No URL')

      if (isMobile()) {
        // 모바일: 새 탭으로 열기 (팝업은 모바일에서 차단됨)
        // 새 탭에서 OAuth 완료 후 postMessage로 알림
        const newTab = window.open(json.url, '_blank', 'noopener')
        popupRef.current = newTab

        // 새 탭이 닫히면 로딩 해제
        pollRef.current = setInterval(() => {
          if (newTab?.closed) {
            cleanup()
          }
        }, 500)
      } else {
        // 데스크탑: 팝업으로 열기
        const width = 600
        const height = 700
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2
        const popup = window.open(
          json.url,
          'facebook-oauth',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        )
        popupRef.current = popup

        // 팝업이 닫히면 로딩 해제
        pollRef.current = setInterval(() => {
          if (popup?.closed) {
            cleanup()
          }
        }, 500)
      }
    } catch {
      setLoading(false)
      router.push(`/${locale}/login?message=Could not authenticate user`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#1877F2] bg-[#1877F2] hover:bg-[#166FE5] transition-all font-semibold text-white text-sm shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="shrink-0 animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="shrink-0">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )}
      <span className="flex-1 text-center">
        {loading ? 'Connecting...' : 'Continue with Facebook'}
      </span>
    </button>
  )
}
