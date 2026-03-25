'use client'

import { useState, useEffect } from 'react'
import { isInAppBrowser } from '@/components/InAppBrowserNotice'
import InAppBrowserNotice from '@/components/InAppBrowserNotice'

function isKakaoTalk(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.userAgent.toLowerCase().includes('kakaotalk')
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/**
 * 인앱 브라우저 감지 시 즉시 외부 브라우저 열기 시도.
 * - 카카오톡: kakaotalk:// 스킴 → 가장 신뢰도 높음
 * - Android: Chrome Intent URL → 앱에 따라 동작
 * - iOS: x-safari-https:// → 앱에 따라 동작 (Apple 정책상 자동 차단 많음)
 * 자동 이동에 실패하면 수동 안내 화면을 보여줌.
 */
function tryOpenExternalBrowser(url: string): void {
  if (isKakaoTalk()) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
    return
  }

  if (isAndroid()) {
    const { host, pathname, search } = window.location
    window.location.href = `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`
    return
  }

  if (isIOS()) {
    // x-safari-https:// 시도 (iOS 17+)
    const withoutProtocol = url.replace(/^https?:\/\//, '')
    window.location.href = `x-safari-https://${withoutProtocol}`
    // 400ms 후에도 페이지가 그대로면 구버전 스킴 재시도
    setTimeout(() => {
      window.location.href = `com-apple-mobilesafari-tab:${url}`
    }, 400)
    return
  }
}

/**
 * 인앱 브라우저로 로그인 페이지 접속 시:
 * 1. 즉시 외부 브라우저 열기 시도
 * 2. 자동 이동이 안 되면(iOS 등) 수동 안내 화면 표시
 */
export default function LoginInAppGate({ children }: { children: React.ReactNode }) {
  const [isInApp, setIsInApp] = useState<boolean | null>(null)
  const [autoAttempted, setAutoAttempted] = useState(false)

  useEffect(() => {
    const inApp = isInAppBrowser()
    setIsInApp(inApp)

    if (inApp) {
      const url = window.location.href
      // 즉시 외부 브라우저 열기 시도
      tryOpenExternalBrowser(url)
      // 1초 후에도 이 페이지가 살아있으면 자동 이동 실패 → 수동 안내 표시
      setTimeout(() => setAutoAttempted(true), 1000)
    }
  }, [])

  // 초기 로딩
  if (isInApp === null) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-3xl shadow-xl overflow-hidden">
          <div className="px-8 py-12 text-center text-hint text-sm">
            잠시만요...
          </div>
        </div>
      </div>
    )
  }

  // 인앱 브라우저 감지됨
  if (isInApp) {
    // 자동 이동 시도 중 (1초 대기) — 이동되면 이 화면은 보이지 않음
    if (!autoAttempted) {
      return (
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-3xl shadow-xl overflow-hidden">
            <div className="px-8 py-12 text-center">
              <div className="text-2xl mb-3">🌐</div>
              <p className="text-body text-sm font-medium">브라우저로 이동 중...</p>
              <p className="text-hint text-xs mt-1">잠시만 기다려 주세요</p>
            </div>
          </div>
        </div>
      )
    }

    // 자동 이동 실패 → 수동 안내 표시
    return (
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-3xl shadow-xl overflow-hidden">
          <div className="px-8 py-8">
            <InAppBrowserNotice standalone />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
