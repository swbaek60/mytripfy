'use client'

import { useState, useEffect } from 'react'

/** 인앱 브라우저(웹뷰) 감지. 로그인 페이지 등에서 전체 UI 분기용으로 export. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const lower = ua.toLowerCase()
  return (
    lower.includes('kakaotalk') ||
    lower.includes('instagram') ||
    lower.includes('fbav') ||
    lower.includes('fban') ||
    lower.includes('fb_iab') ||
    lower.includes('fb_ios') ||
    lower.includes('fb4a') ||
    lower.includes('line/') ||
    lower.includes('line ') ||
    lower.includes('naver') ||
    lower.includes('snapchat') ||
    lower.includes('twitter') ||
    lower.includes('whatsapp') ||
    lower.includes('telegram') ||
    lower.includes('discord') ||
    lower.includes('slack') ||
    lower.includes('tiktok') ||
    lower.includes('micromessenger') ||
    lower.includes('wechat') ||
    (lower.includes('teams') && (lower.includes('microsoft') || lower.includes('electron'))) ||
    /\/iab$/i.test(ua) ||
    /;\s*iab\s*;/i.test(ua)
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

/** Android (카카오 제외): Chrome Intent (Chrome 공식 문서·Stack Overflow 등에서 사용하는 형식) */
function getChromeIntentUrl(): string {
  const { host, pathname, search } = window.location
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`
}

/** iOS: Safari로 열기. iOS 17+ x-safari-https, 구버전 com-apple-mobilesafari-tab (실무에서 권장) */
function getSafariIosUrl(): string {
  const url = window.location.href
  const withoutProtocol = url.replace(/^https?:\/\//, '')
  return `x-safari-https://${withoutProtocol}`
}

function getSafariIosLegacyUrl(): string {
  const url = window.location.href
  return `com-apple-mobilesafari-tab:${url}`
}

/** iOS: Chrome 앱으로 열기 (Chrome 설치 시). https → googlechromes:// */
function getChromeIosUrl(): string {
  const url = window.location.href
  if (url.startsWith('https://')) return `googlechromes://${url.slice(8)}`
  if (url.startsWith('http://')) return `googlechrome://${url.slice(7)}`
  return `googlechromes://${url}`
}

const noticeContent = (
  copied: boolean,
  onCopy: () => void,
  onOpenExternal: () => void,
  showCloseButton: boolean,
  onClose: () => void
) => (
  <>
    <p className="font-medium">
      Google 로그인은 앱 안 브라우저(카카오톡·라인·인스타·페이스북·왓츠앱·텔레그램 등)에서 사용할 수 없습니다.
    </p>
    <p className="mt-2 text-amber-800">
      <strong>브라우저에서 열기</strong>를 누르면 Safari 또는 Chrome으로 넘어갈 수 있습니다.
      앱에 따라 동작하지 않을 수 있으니, 그때는 <strong>주소 복사</strong> 후 Safari·Chrome에 붙여넣어 주세요.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onOpenExternal}
        className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-500"
      >
        브라우저에서 열기
      </button>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-lg bg-amber-200 px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-300"
      >
        {copied ? '✓ 복사됨!' : '주소 복사'}
      </button>
      {showCloseButton && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs underline text-amber-700 hover:text-amber-900"
        >
          안내 닫기
        </button>
      )}
    </div>
  </>
)

export default function InAppBrowserNotice({ standalone = false }: { standalone?: boolean }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!standalone) setShow(isInAppBrowser())
  }, [standalone])

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

  const openInExternalBrowser = () => {
    if (isKakaoTalk()) {
      window.location.href = getKakaoOpenExternalUrl()
    } else if (isAndroid()) {
      window.location.href = getChromeIntentUrl()
    } else if (isIOS()) {
      window.location.href = getSafariIosUrl()
      setTimeout(() => {
        window.location.href = getSafariIosLegacyUrl()
      }, 400)
    } else {
      window.open(window.location.href, '_blank', 'noopener,noreferrer')
    }
  }

  const visible = standalone || show
  if (!visible) return null

  return (
    <div
      role="alert"
      className={
        standalone
          ? 'rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900'
          : 'mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'
      }
    >
      {noticeContent(copied, copyUrl, openInExternalBrowser, !standalone, () => setShow(false))}
    </div>
  )
}
