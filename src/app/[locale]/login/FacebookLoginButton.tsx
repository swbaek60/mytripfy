'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  locale: string
}

const POPUP_NAME = 'mytripfy_oauth'

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
}

export default function FacebookLoginButton({ locale }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleOAuthMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'mytripfy_oauth_done' && event.data?.locale) {
        window.removeEventListener('message', handleOAuthMessage)
        window.location.href = `/${event.data.locale}`
      }
      if (event.data?.type === 'FACEBOOK_AUTH_COMPLETE' && event.data?.success === false) {
        window.removeEventListener('message', handleOAuthMessage)
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    return () => {
      window.removeEventListener('message', handleOAuthMessage)
    }
  }, [handleOAuthMessage])

  async function handleClick() {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/auth/facebook-url?locale=${locale}`)
      const json = await res.json()
      if (!res.ok) {
        const msg = json?.error || json?.message || 'Could not start Facebook login.'
        router.push(`/${locale}/login?message=${encodeURIComponent(msg)}`)
        setLoading(false)
        return
      }
      if (!json.url) {
        router.push(`/${locale}/login?message=${encodeURIComponent(json?.error || 'Could not get login URL.')}`)
        setLoading(false)
        return
      }

      document.cookie = `mytripfy_fb_locale=${encodeURIComponent(locale)}; path=/; max-age=300; samesite=lax`
      const mobile = isMobile()

      if (mobile) {
        // 모바일: trip.com처럼 새 창에서 OAuth → 콜백에서 postMessage 후 창 닫기 → 여기서 수신 후 /locale 이동
        try {
          sessionStorage.setItem('mytripfy_oauth_locale', locale)
          window.addEventListener('message', handleOAuthMessage)
          const w = window.open(json.url, POPUP_NAME, 'noopener,noreferrer,width=500,height=600')
          if (!w) {
            sessionStorage.removeItem('mytripfy_oauth_locale')
            window.removeEventListener('message', handleOAuthMessage)
            window.location.href = json.url
          } else {
            // 팝업이 열린 동안 로딩 유지, 닫으면 해제
            const tid = setInterval(() => {
              if (w.closed) {
                clearInterval(tid)
                window.removeEventListener('message', handleOAuthMessage)
                setLoading(false)
              }
            }, 300)
          }
        } catch {
          window.location.href = json.url
        }
      } else {
        // 데스크톱: 같은 탭에서 이동 (쿼리 스트링 유지를 위해 location.href)
        window.location.href = json.url
      }
    } catch {
      setLoading(false)
      router.push(`/${locale}/login?message=Could+not+start+Facebook+login.`)
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
