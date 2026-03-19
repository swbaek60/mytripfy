'use client'

import { useEffect } from 'react'

const BROADCAST_CHANNEL = 'mytripfy_oauth'
const STORAGE_KEY_RETRY = 'mytripfy_oauth_retry_url'
const STORAGE_KEY_RETRY_TS = 'mytripfy_oauth_retry_ts'
const STORAGE_KEY_PICKUP = 'mytripfy_oauth_pickup_url'
const STORAGE_KEY_PICKUP_TS = 'mytripfy_oauth_pickup_ts'
const STORAGE_TTL_MS = 2 * 60 * 1000

/**
 * OAuth가 새 탭/팝업에서 완료됐을 때 BroadcastChannel(및 localStorage 폴백)로 전달되는 신호를 수신합니다.
 *
 * - oauth_retry: exchange가 새 탭에서 실패 → 이 탭이 콜백 URL로 이동해 재시도
 * - oauth_complete: 성공 → pickupUrl로 이동해 세션 쿠키를 받은 뒤 홈으로
 *
 * 모바일에서 백그라운드 탭이 메시지를 못 받을 수 있으므로, 탭이 다시 보일 때(visibilitychange)와
 * 마운트 시 localStorage를 확인해 retry/pickup URL이 있으면 해당 URL로 이동합니다.
 */
function readStorageFallback(origin: string): boolean {
  try {
    const now = Date.now()
    const retryUrl = localStorage.getItem(STORAGE_KEY_RETRY)
    const retryTs = localStorage.getItem(STORAGE_KEY_RETRY_TS)
    if (retryUrl && retryUrl.startsWith(origin) && retryTs && now - Number(retryTs) < STORAGE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY_RETRY)
      localStorage.removeItem(STORAGE_KEY_RETRY_TS)
      window.location.href = retryUrl
      return true
    }
    const pickupUrl = localStorage.getItem(STORAGE_KEY_PICKUP)
    const pickupTs = localStorage.getItem(STORAGE_KEY_PICKUP_TS)
    if (pickupUrl && pickupUrl.startsWith(origin) && pickupTs && now - Number(pickupTs) < STORAGE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY_PICKUP)
      localStorage.removeItem(STORAGE_KEY_PICKUP_TS)
      window.location.replace(pickupUrl)
      return true
    }
  } catch {
    // ignore
  }
  return false
}

export default function OAuthPopupListener() {
  useEffect(() => {
    const origin = window.location.origin

    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL)
    } catch {
      // BroadcastChannel 없으면 localStorage만 사용
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

    if (channel) {
      channel.onmessage = handleMessage
    }

    readStorageFallback(origin)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        readStorageFallback(origin)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const pollMs = 800
    const pollCount = 20
    let count = 0
    const poll = setInterval(() => {
      if (readStorageFallback(origin)) {
        clearInterval(poll)
        return
      }
      count += 1
      if (count >= pollCount) clearInterval(poll)
    }, pollMs)

    return () => {
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisibility)
      channel?.close()
    }
  }, [])

  return null
}
