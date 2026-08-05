'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

/** 인앱 브라우저(웹뷰) 감지. 로그인 페이지 등에서 전체 UI 분기용으로 export. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const lower = ua.toLowerCase()

  // 모바일 일반 브라우저(Chrome, Safari 등)는 인앱으로 보지 않음 — 오탐 방지
  // Android: Chrome 앱은 'Chrome/' 있고 WebView는 '; wv)' 포함
  if (/android/i.test(ua) && /chrome\/[\d.]+/i.test(ua) && !/;\s*wv\)/i.test(ua)) return false
  // iOS: Safari 앱은 'Safari/' 있고, 인앱 WebView는 fb_iab/fbav/instagram 등 별도 문자열 포함
  if (/iphone|ipad|ipod/i.test(ua) && /safari\/[\d.]+/i.test(ua) && !/fb_iab|fbav|fban|fb_ios|fb4a|instagram|kakaotalk|line\/|line\s|naver|micromessenger|wechat/i.test(lower)) return false
  // Samsung Internet, Firefox 모바일 등
  if (/samsungbrowser\/[\d.]+/i.test(ua) || (/android/i.test(ua) && /firefox\/[\d.]+/i.test(ua))) return false

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

function NoticeContent({
  copied,
  onCopy,
  onOpenExternal,
  showCloseButton,
  onClose,
}: {
  copied: boolean
  onCopy: () => void
  onOpenExternal: () => void
  showCloseButton: boolean
  onClose: () => void
}) {
  const t = useTranslations('InAppBrowser')
  return (
    <>
      <p className="font-medium">{t('title')}</p>
      <p className="mt-2 text-warning-strong">{t('desc')}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenExternal}
          className="rounded-lg bg-warning-strong px-4 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
        >
          {t('openInBrowser')}
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg bg-warning-muted px-4 py-2.5 text-sm font-medium text-warning-strong transition-colors hover:bg-warning-border"
        >
          {copied ? t('copied') : t('copyAddress')}
        </button>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs underline text-warning-strong hover:no-underline"
          >
            {t('closeNotice')}
          </button>
        )}
      </div>
    </>
  )
}

export default function InAppBrowserNotice({ standalone = false }: { standalone?: boolean }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // userAgent 판별은 브라우저에서만 가능하므로 서버 HTML 과 맞출 수 없다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          ? 'rounded-2xl border border-warning-border bg-warning-light p-6 text-sm text-warning-strong'
          : 'mb-4 rounded-xl border border-warning-border bg-warning-light p-4 text-sm text-warning-strong'
      }
    >
      <NoticeContent copied={copied} onCopy={copyUrl} onOpenExternal={openInExternalBrowser} showCloseButton={!standalone} onClose={() => setShow(false)} />
    </div>
  )
}
