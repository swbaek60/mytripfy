'use client'

import { useEffect } from 'react'

/**
 * 새 창(팝업)에서 OAuth가 완료됐을 때 postMessage를 수신해 현재 탭을 이동시킵니다.
 *
 * 흐름:
 *   1. 모바일 브라우저가 OAuth 창을 새 탭으로 열었을 때
 *   2. /auth/callback이 window.opener.postMessage({ type: 'oauth_complete', dest }) 전송
 *   3. 이 컴포넌트가 수신 → window.location.replace(dest) 로 이동
 *
 * 같은 탭에서 이동한 경우에는 이 컴포넌트가 실행될 일이 없으므로 부작용 없음.
 */
export default function OAuthPopupListener() {
  useEffect(() => {
    const origin = window.location.origin

    function handleMessage(event: MessageEvent) {
      // 동일 origin 메시지만 처리
      if (event.origin !== origin) return
      if (!event.data || event.data.type !== 'oauth_complete') return

      const dest = typeof event.data.dest === 'string' ? event.data.dest : `${origin}/en`
      window.location.replace(dest)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return null
}
