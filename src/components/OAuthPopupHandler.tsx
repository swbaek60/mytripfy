'use client'

import { useEffect } from 'react'

/**
 * [locale] 레이아웃에서만 사용.
 * OAuth 팝업이 /en?code=... 또는 /en#_=_ 로 열린 경우:
 * - code가 있으면 → /auth/callback으로 바로 보내서 세션 설정 후 창 닫기
 * - code 없이 #_=_ 만 있으면 → 부모에 실패 알리고 창 닫기 (팝업만 정리)
 */
export default function OAuthPopupHandler({ locale }: { locale: string }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.opener) return

    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')

    if (code) {
      // Supabase가 /en?code=... 로 리다이렉트한 경우 → 콜백으로 보내서 세션 설정 + 창 닫기
      const params = new URLSearchParams(url.searchParams)
      if (!params.has('locale')) params.set('locale', locale)
      window.location.replace(`/auth/callback?${params.toString()}`)
      return
    }

    if (url.hash === '#_=_') {
      // Facebook이 #_=_ 만 붙이고 code가 없는 경우 (리다이렉트 URL이 /auth/callback이 아님)
      try {
        window.opener.postMessage(
          { type: 'FACEBOOK_AUTH_COMPLETE', success: false, locale },
          window.location.origin
        )
      } catch {
        // ignore
      }
      window.close()
    }
  }, [locale])

  return null
}
