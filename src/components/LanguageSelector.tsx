'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import CountryFlag from '@/components/CountryFlag'
import { routing } from '@/i18n/routing'
import { updatePreferredLocale } from '@/app/[locale]/actions'

// locale → country code (국기 표시용)
const LOCALE_TO_COUNTRY: Record<string, string> = {
  ko: 'KR', ja: 'JP', zh: 'CN', 'zh-TW': 'TW',
  th: 'TH', vi: 'VN', id: 'ID', ms: 'MY', hi: 'IN', bn: 'BD',
  en: 'GB', fr: 'FR', de: 'DE', es: 'ES', it: 'IT', pt: 'PT', 'pt-BR': 'BR',
  nl: 'NL', sv: 'SE', pl: 'PL', ru: 'RU', uk: 'UA', tr: 'TR',
  ar: 'SA', fa: 'IR',
}

// compact 모드에서 표시할 짧은 코드 (전부 언어 코드 ISO 639-1)
function getLocaleShortLabel(locale: string): string {
  return locale.split('-')[0].toUpperCase()
}

// 대륙별로 정렬 (trip.com은 지역별, 우리는 언어 사용 인구순 + 지역 그룹)
const LANGUAGE_GROUPS = [
  {
    region: '🌏 East Asia',
    color: 'from-rose-500 to-pink-500',
    langs: [
      { locale: 'ko', native: '한국어', english: 'Korean' },
      { locale: 'ja', native: '日本語', english: 'Japanese' },
      { locale: 'zh', native: '中文 (简体)', english: 'Chinese Simplified' },
      { locale: 'zh-TW', native: '中文 (繁體)', english: 'Chinese Traditional' },
    ],
  },
  {
    region: '🌴 Southeast Asia & South Asia',
    color: 'from-orange-500 to-amber-500',
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
    region: '🌍 Europe (West)',
    color: 'from-blue-500 to-indigo-500',
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
    region: '🏔️ Europe (East) & Central Asia',
    color: 'from-violet-500 to-purple-500',
    langs: [
      { locale: 'ru', native: 'Русский', english: 'Russian' },
      { locale: 'uk', native: 'Українська', english: 'Ukrainian' },
      { locale: 'tr', native: 'Türkçe', english: 'Turkish' },
    ],
  },
  {
    region: '🌙 Middle East',
    color: 'from-teal-500 to-emerald-500',
    langs: [
      { locale: 'ar', native: 'العربية', english: 'Arabic' },
      { locale: 'fa', native: 'فارسی', english: 'Persian' },
    ],
  },
]

// 현재 pathname에서 locale 세그먼트만 교체 (25개 로케일 = routing.locales)
function switchLocaleInPath(pathname: string, newLocale: string): string {
  const segments = pathname.split('/')
  if (segments.length > 1 && (routing.locales as readonly string[]).includes(segments[1])) {
    segments[1] = newLocale
    return segments.join('/')
  }
  return `/${newLocale}${pathname}`
}

interface Props {
  currentLocale: string
  compact?: boolean
  /** 아이콘만 표시 (모바일 상단 등 공간 절약) */
  iconOnly?: boolean
  /** 로그인한 사용자 ID. 있으면 언어 선택 시 프로필에 저장해 두었다가 다음 로그인 시 해당 언어로 표시 */
  userId?: string
}

export default function LanguageSelector({ currentLocale, compact, iconOnly, userId }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const modalRef = useRef<HTMLDivElement>(null)

  // 현재 언어 정보 찾기
  const allLangs = LANGUAGE_GROUPS.flatMap(g => g.langs)
  const currentLang = allLangs.find(l => l.locale === currentLocale) || allLangs[0]

  // 검색 필터
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

  // 바깥 클릭시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSelect = (locale: string) => {
    setOpen(false)
    setSearch('')
    if (userId) updatePreferredLocale(locale).catch(() => {})
    const newPath = switchLocaleInPath(pathname, locale)
    router.push(newPath)
  }

  return (
    <div className="relative" ref={modalRef}>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className={iconOnly
          ? "w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
          : compact
            ? "flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
            : "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium text-gray-600 group"
        }
        aria-label="Select language"
      >
        {LOCALE_TO_COUNTRY[currentLang.locale] ? (
          <CountryFlag code={LOCALE_TO_COUNTRY[currentLang.locale]} size={iconOnly ? 'sm' : 'sm'} />
        ) : (
          <span className="text-base leading-none">🌐</span>
        )}
        {!iconOnly && !compact && <span className="hidden sm:inline text-xs">{currentLang.native.split(' ')[0]}</span>}
        {!iconOnly && compact
          ? <span className="text-xs uppercase font-semibold">{getLocaleShortLabel(currentLang.locale)}</span>
          : !iconOnly && <svg
              className={`w-3 h-3 transition-transform duration-200 text-gray-400 group-hover:text-blue-500 ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
        }
      </button>

      {/* 모달 패널 */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* 패널 */}
          <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

            {/* 헤더 */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Select Language</h2>
                  <p className="text-xs text-gray-400 mt-0.5">25 languages available</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* 검색창 */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search language..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* 언어 목록 */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {filtered.map(group => (
                <div key={group.region}>
                  {/* 지역 헤더 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-1 w-5 rounded-full bg-gradient-to-r ${group.color}`} />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {group.region}
                    </span>
                  </div>

                  {/* 언어 그리드 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.langs.map(lang => {
                      const isActive = lang.locale === currentLocale
                      return (
                        <button
                          key={lang.locale}
                          onClick={() => handleSelect(lang.locale)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                              : 'hover:bg-gray-50 border border-gray-100 hover:border-blue-200'
                          }`}
                        >
                          {LOCALE_TO_COUNTRY[lang.locale] ? (
                            <CountryFlag code={LOCALE_TO_COUNTRY[lang.locale]} size="md" className={isActive ? 'ring-1 ring-white/50' : ''} />
                          ) : (
                            <span className="text-xl leading-none shrink-0">🌐</span>
                          )}
                          <div className="min-w-0">
                            <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                              {lang.native}
                            </div>
                            <div className={`text-xs truncate ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
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
                <div className="text-center py-10 text-gray-400">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm">No language found for &quot;{search}&quot;</p>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400 text-center">
                More languages coming soon · <span className="text-blue-500">Suggest a language</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
