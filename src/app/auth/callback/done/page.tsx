'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

/**
 * OAuth 성공 후 도착 페이지.
 * - 팝업으로 열렸으면(opener 있음): 부모에 postMessage 보내고 창 닫기.
 * - 같은 탭이면: /{locale} 로 리다이렉트.
 */
function AuthCallbackDoneContent() {
  const searchParams = useSearchParams()
  const locale = searchParams.get('locale') || 'en'

  useEffect(() => {
    const origin = window.location.origin
    if (typeof window !== 'undefined' && window.opener) {
      try {
        window.opener.postMessage(
          { type: 'mytripfy_oauth_done', locale },
          origin
        )
      } catch {
        // ignore
      }
      window.close()
    } else {
      window.location.replace(`/${locale}`)
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
    <Suspense fallback={
      <div className="min-h-[200px] flex items-center justify-center p-4">
        <p className="text-gray-600">Signing in...</p>
      </div>
    }>
      <AuthCallbackDoneContent />
    </Suspense>
  )
}
