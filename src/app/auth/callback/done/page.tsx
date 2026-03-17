'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

/**
 * OAuth 성공 후 도착 페이지.
 * - 팝업으로 열렸으면 (window.opener 있음): 부모 창을 /{locale}로 보내고 이 창 닫기.
 * - 같은 탭이면: /{locale}로 이동.
 */
function AuthCallbackDoneContent() {
  const searchParams = useSearchParams()
  const locale = searchParams.get('locale') || 'en'

  useEffect(() => {
    const targetUrl = `/${locale}`

    if (typeof window !== 'undefined' && window.opener) {
      try {
        window.opener.location.href = targetUrl
      } catch {
        // cross-origin 등으로 실패 시 무시
      }
      window.close()
    } else {
      window.location.replace(targetUrl)
    }
  }, [locale])

  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <p className="text-gray-600">Signing in...</p>
    </div>
  )
}

export default function AuthCallbackDonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <p className="text-gray-600">Signing in...</p>
        </div>
      }
    >
      <AuthCallbackDoneContent />
    </Suspense>
  )
}
