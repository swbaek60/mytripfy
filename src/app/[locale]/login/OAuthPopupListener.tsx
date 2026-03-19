'use client'

import { useEffect } from 'react'

const BROADCAST_CHANNEL = 'mytripfy_oauth'

/**
 * OAuth가 새 탭/팝업에서 완료됐을 때 BroadcastChannel로 전달되는 신호를 수신합니다.
 *
 * - oauth_retry: exchange가 새 탭에서 실패( code_verifier 없음 ) → 이 탭이 콜백 URL로 이동해 재시도
 * - oauth_complete: 성공 → pickupUrl로 이동해 세션 쿠키를 받은 뒤 홈으로
 *
 * BroadcastChannel을 사용해 Android 등에서 window.opener가 null이어도 동작합니다.
 */
export default function OAuthPopupListener() {
  useEffect(() => {
    const origin = window.location.origin

    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL)
    } catch {
      return
    }

    function handleMessage(event: MessageEvent) {
      const data = event.data
      if (!data || typeof data !== 'object') return

      if (data.type === 'oauth_retry' && typeof data.url === 'string' && data.url.startsWith(origin)) {
        window.location.href = data.url
        return
      }

      if (data.type === 'oauth_complete') {
        const pickupUrl = typeof data.pickupUrl === 'string' ? data.pickupUrl : ''
        const dest = typeof data.dest === 'string' ? data.dest : `${origin}/en`
        if (pickupUrl.startsWith(origin)) {
          window.location.replace(pickupUrl)
        } else {
          window.location.replace(dest)
        }
      }
    }

    channel.onmessage = handleMessage
    return () => {
      channel?.close()
    }
  }, [])

  return null
}
