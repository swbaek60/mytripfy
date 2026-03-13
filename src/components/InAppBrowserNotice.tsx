'use client'

import { useState, useEffect } from 'react'

/** 카카오톡·인스타·페이스북 등 인앱 브라우저(웹뷰) 감지.
 * Google OAuth는 이런 환경에서 정책상 차단되므로, 브라우저에서 열어달라고 안내. */
function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return (
    ua.includes('kakaotalk') ||
    ua.includes('instagram') ||
    ua.includes('fbav') ||
    ua.includes('fban') ||
    ua.includes('fb_iab') ||
    ua.includes('line/') ||
    ua.includes('naver') ||
    ua.includes('snapchat') ||
    ua.includes('twitter')
  )
}

export default function InAppBrowserNotice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(isInAppBrowser())
  }, [])

  if (!show) return null

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="font-medium">
        Google 로그인은 카카오톡·인스타 등 앱 안 브라우저에서 제한됩니다.
      </p>
      <p className="mt-1 text-amber-800">
        <strong>Chrome</strong> 또는 <strong>Safari</strong>에서 이 페이지를 열어주세요.
        (링크 길게 누르기 → &quot;브라우저에서 열기&quot;)
      </p>
      <p className="mt-1 text-xs text-amber-700">
        Google sign-in is blocked in in-app browsers. Open this page in Chrome or Safari.
      </p>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="mt-2 text-xs underline text-amber-700 hover:text-amber-900"
      >
        안내 닫기
      </button>
    </div>
  )
}
