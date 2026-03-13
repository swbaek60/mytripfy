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

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isKakaoTalk(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.userAgent.toLowerCase().includes('kakaotalk')
}

/** 카카오톡 인앱 → 외부 브라우저 (카카오 공식 스킴, 트립닷컴 등 대형 사이트도 동일 방식 사용) */
function getKakaoOpenExternalUrl(): string {
  const url = window.location.href
  return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
}

/** Android (카카오 제외): Chrome Intent */
function getChromeIntentUrl(): string {
  const { host, pathname, search } = window.location
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`
}

/** iOS (카카오 제외): Chrome 앱으로 열기. https → googlechromes://, http → googlechrome:// */
function getChromeIosUrl(): string {
  const url = window.location.href
  if (url.startsWith('https://')) return `googlechromes://${url.slice(8)}`
  if (url.startsWith('http://')) return `googlechrome://${url.slice(7)}`
  return `googlechromes://${url}`
}

export default function InAppBrowserNotice() {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setShow(isInAppBrowser())
  }, [])

  const copyUrl = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  /** 외부 브라우저로 열기. 카카오는 공식 스킴, 그 외는 Intent(Android) / Chrome(iOS) / 새창 시도 */
  const openInExternalBrowser = () => {
    const url = window.location.href
    if (isKakaoTalk()) {
      window.location.href = getKakaoOpenExternalUrl()
    } else if (isAndroid()) {
      window.location.href = getChromeIntentUrl()
    } else if (isIOS()) {
      // iOS 인앱(인스타 등): Chrome 스킴 시도. 안 되면 새 창(일부 앱에서 Safari로 열림)
      window.location.href = getChromeIosUrl()
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  if (!show) return null

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="font-medium">
        Google 로그인은 앱 안 브라우저(카카오톡·인스타·라인 등)에서 사용할 수 없습니다.
      </p>
      <p className="mt-2 text-amber-800">
        <strong>브라우저에서 열기</strong>를 눌러 주세요. 카카오톡은 한 번에 전환되고,
        인스타·라인 등은 안 될 수 있어 그때는 <strong>주소 복사</strong> 후 Chrome/Safari에 붙여넣기 하세요.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openInExternalBrowser}
          className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-500"
        >
          브라우저에서 열기
        </button>
        <button
          type="button"
          onClick={copyUrl}
          className="rounded-lg bg-amber-200 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-300"
        >
          {copied ? '✓ 복사됨!' : '주소 복사'}
        </button>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="text-xs underline text-amber-700 hover:text-amber-900"
        >
          안내 닫기
        </button>
      </div>
    </div>
  )
}
