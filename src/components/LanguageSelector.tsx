'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import CountryFlag from '@/components/CountryFlag'
import { usePathname, getPathname } from '@/i18n/routing'
import { updatePreferredLocale } from '@/app/[locale]/actions'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import ModalPortalShell from '@/components/ui/ModalPortalShell'

const LOCALE_TO_COUNTRY: Record<string, string> = {
  ko: 'KR', ja: 'JP', zh: 'CN', 'zh-TW': 'TW',
  th: 'TH', vi: 'VN', id: 'ID', ms: 'MY', hi: 'IN', bn: 'BD',
  fr: 'FR', de: 'DE', es: 'ES', it: 'IT', pt: 'PT', 'pt-BR': 'BR',
  nl: 'NL', sv: 'SE', pl: 'PL', ru: 'RU', uk: 'UA', tr: 'TR',
  ar: 'SA', fa: 'IR',
}

function GlobeIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-brand ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

function getLocaleShortLabel(locale: string): string {
  return locale.split('-')[0].toUpperCase()
}

const LANGUAGE_GROUPS = [
  {
    regionKey: 'regionEastAsia' as const,
    color: 'from-challenge to-purple',
    langs: [
      { locale: 'ko', native: '한국어', english: 'Korean' },
      { locale: 'ja', native: '日本語', english: 'Japanese' },
      { locale: 'zh', native: '中文 (简体)', english: 'Chinese Simplified' },
      { locale: 'zh-TW', native: '中文 (繁體)', english: 'Chinese Traditional' },
    ],
  },
  {
    regionKey: 'regionSoutheastAsia' as const,
    color: 'from-sunset to-warning',
    langs: [
      { locale: 'th', native: 'ภาษาไทย', english: 'Thai' },
      { locale: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
      { locale: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
      { locale: 'ms', native: 'Bahasa Melayu', english: 'Malay' },
      { locale: 'hi', native: 'हिन्दी', english: 'Hindi' },
      { locale: 'bn', native: 'বাংলা', english: 'Bengali' },
    ],
  },
  {
    regionKey: 'regionEuropeWest' as const,
    color: 'from-brand to-indigo',
    langs: [
      { locale: 'en', native: 'English', english: 'English' },
      { locale: 'fr', native: 'Français', english: 'French' },
      { locale: 'de', native: 'Deutsch', english: 'German' },
      { locale: 'es', native: 'Español', english: 'Spanish' },
      { locale: 'it', native: 'Italiano', english: 'Italian' },
      { locale: 'pt', native: 'Português', english: 'Portuguese' },
      { locale: 'pt-BR', native: 'Português (Brasil)', english: 'Portuguese (Brazil)' },
      { locale: 'nl', native: 'Nederlands', english: 'Dutch' },
      { locale: 'sv', native: 'Svenska', english: 'Swedish' },
      { locale: 'pl', native: 'Polski', english: 'Polish' },
    ],
  },
  {
    regionKey: 'regionEuropeEast' as const,
    color: 'from-purple to-indigo',
    langs: [
      { locale: 'ru', native: 'Русский', english: 'Russian' },
      { locale: 'uk', native: 'Українська', english: 'Ukrainian' },
      { locale: 'tr', native: 'Türkçe', english: 'Turkish' },
    ],
  },
  {
    regionKey: 'regionMiddleEast' as const,
    color: 'from-teal to-success',
    langs: [
      { locale: 'ar', native: 'العربية', english: 'Arabic' },
      { locale: 'fa', native: 'فارسی', english: 'Persian' },
    ],
  },
]

interface Props {
  currentLocale: string
  compact?: boolean
  iconOnly?: boolean
  userId?: string
  onOverlayOpen?: () => void
  /** Controlled modal open state (HeaderNav root mount) */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Hide trigger button — use LocaleTriggerButton separately */
  hideTrigger?: boolean
}

export function LocaleTriggerButton({
  currentLocale,
  compact,
  iconOnly,
  open,
  onClick,
}: {
  currentLocale: string
  compact?: boolean
  iconOnly?: boolean
  open?: boolean
  onClick: () => void
}) {
  const t = useTranslations('Nav')
  const allLangs = LANGUAGE_GROUPS.flatMap(g => g.langs)
  const currentLang = allLangs.find(l => l.locale === currentLocale) || allLangs[0]

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={iconOnly
        ? 'w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-body shrink-0'
        : compact
          ? 'flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors text-sm font-medium text-body'
          : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-edge hover:border-brand hover:bg-brand-light transition-all text-sm font-medium text-body group'
      }
      aria-label={t('language')}
    >
      {LOCALE_TO_COUNTRY[currentLang.locale] ? (
        <CountryFlag code={LOCALE_TO_COUNTRY[currentLang.locale]} size="sm" />
      ) : (
        <GlobeIcon className="w-5 h-5" />
      )}
      {!iconOnly && !compact && (
        <span className="hidden sm:inline text-xs">{currentLang.native.split(' ')[0]}</span>
      )}
      {!iconOnly && compact && (
        <span className="text-xs uppercase font-semibold">{getLocaleShortLabel(currentLang.locale)}</span>
      )}
      {!iconOnly && !compact && (
        <svg
          className={`w-3 h-3 transition-transform duration-200 text-hint group-hover:text-brand ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  )
}

export default function LanguageSelector({
  currentLocale,
  compact,
  iconOnly,
  userId,
  onOverlayOpen,
  open: controlledOpen,
  onOpenChange,
  hideTrigger,
}: Props) {
  const t = useTranslations('LanguagePicker')
  const tc = useTranslations('Common')
  const [internalOpen, setInternalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [switching, setSwitching] = useState(false)
  const pathname = usePathname()
  const searchRef = useRef<HTMLInputElement>(null)

  const isOpen = controlledOpen ?? internalOpen
  const isControlled = controlledOpen !== undefined
  const setOpen = useCallback(
    (value: boolean) => {
      onOpenChange?.(value)
      if (!isControlled) setInternalOpen(value)
    },
    [onOpenChange, isControlled]
  )

  // 모달은 사용자 조작으로만 열리므로 isOpen 자체가 하이드레이션 이후를 뜻한다.
  useBodyScrollLock(isOpen)

  const filtered = search.trim()
    ? LANGUAGE_GROUPS.map(group => ({
        ...group,
        langs: group.langs.filter(
          l =>
            l.native.toLowerCase().includes(search.toLowerCase()) ||
            l.english.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.langs.length > 0)
    : LANGUAGE_GROUPS

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  useEffect(() => {
    if (!isOpen) return
    const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (!isMobile) {
      const timer = window.setTimeout(() => searchRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
  }, [isOpen])

  const handleSelect = async (locale: string) => {
    if (switching || locale === currentLocale) {
      setOpen(false)
      setSearch('')
      return
    }
    setSwitching(true)
    setOpen(false)
    setSearch('')

    if (userId) {
      try {
        await updatePreferredLocale(locale)
      } catch {
        /* navigation still proceeds */
      }
    }

    const href = getPathname({ href: pathname, locale })
    window.location.assign(href)
  }

  const onLanguageSelect = (locale: string) => () => {
    void handleSelect(locale)
  }

  const modal = isOpen ? createPortal(
    <ModalPortalShell onBackdropClick={() => setOpen(false)}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[min(88dvh,calc(100dvh-1.5rem))] sm:h-auto sm:max-h-[min(85vh,92dvh)]">
        <div className="px-6 pt-6 pb-4 border-b border-edge shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-heading">{t('selectTitle')}</h2>
              <p className="text-xs text-hint mt-0.5">{t('selectSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tc('close')}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-hint hover:text-body"
            >
              ✕
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hint text-sm">🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-sunken rounded-xl border border-edge focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-transparent"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-6 py-4 touch-pan-y">
          {filtered.map(group => (
            <div key={group.regionKey}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-1 w-5 rounded-full bg-gradient-to-r ${group.color}`} />
                <span className="text-xs font-semibold text-hint uppercase tracking-wide">
                  {t(group.regionKey)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.langs.map(lang => {
                  const isActive = lang.locale === currentLocale
                  return (
                    <button
                      type="button"
                      key={lang.locale}
                      onClick={onLanguageSelect(lang.locale)}
                      disabled={switching}
                      style={{ touchAction: 'manipulation' }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group ${
                        isActive
                          ? 'bg-brand text-white shadow-md shadow-edge-brand'
                          : 'hover:bg-surface-hover border border-edge hover:border-edge-brand'
                      }`}
                    >
                      {LOCALE_TO_COUNTRY[lang.locale] ? (
                        <CountryFlag code={LOCALE_TO_COUNTRY[lang.locale]} size="md" className={isActive ? 'ring-1 ring-white/50' : ''} />
                      ) : (
                        <GlobeIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-brand'}`} />
                      )}
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-heading'}`}>
                          {lang.native}
                        </div>
                        <div className={`text-xs truncate ${isActive ? 'text-edge-brand' : 'text-hint'}`}>
                          {lang.english}
                        </div>
                      </div>
                      {isActive && (
                        <span className="ml-auto text-white text-sm shrink-0">✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-hint">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm">{tc('noLanguageFound', { search })}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-edge bg-surface-sunken/50 shrink-0">
          <p className="text-xs text-hint text-center">{t('footerHint')}</p>
        </div>
      </div>
    </ModalPortalShell>,
    document.body
  ) : null

  if (hideTrigger) {
    return modal
  }

  return (
    <div className="relative">
      <LocaleTriggerButton
        currentLocale={currentLocale}
        compact={compact}
        iconOnly={iconOnly}
        open={isOpen}
        onClick={() => {
          const next = !isOpen
          if (next) onOverlayOpen?.()
          setOpen(next)
        }}
      />
      {modal}
    </div>
  )
}
