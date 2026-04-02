import { routing } from '@/i18n/routing'

/** 프로덕션·미리보기 공통. Vercel에서는 NEXT_PUBLIC_SITE_URL 설정 권장 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
).replace(/\/$/, '')

/**
 * 앱 로케일 코드 → Open Graph locale (언어_지역)
 * 미등록 로케일은 en_US
 */
export const OG_LOCALE_BY_APP_LOCALE: Record<string, string> = {
  en: 'en_US',
  ko: 'ko_KR',
  ja: 'ja_JP',
  zh: 'zh_CN',
  'zh-TW': 'zh_TW',
  es: 'es_ES',
  pt: 'pt_PT',
  'pt-BR': 'pt_BR',
  fr: 'fr_FR',
  de: 'de_DE',
  it: 'it_IT',
  nl: 'nl_NL',
  pl: 'pl_PL',
  sv: 'sv_SE',
  ru: 'ru_RU',
  uk: 'uk_UA',
  tr: 'tr_TR',
  ar: 'ar_SA',
  fa: 'fa_IR',
  hi: 'hi_IN',
  bn: 'bn_BD',
  id: 'id_ID',
  ms: 'ms_MY',
  vi: 'vi_VN',
  th: 'th_TH',
}

export function ogLocaleFor(locale: string): string {
  return OG_LOCALE_BY_APP_LOCALE[locale] || 'en_US'
}

/**
 * @param path '' 홈, '/companions', '/companions/uuid' (로케일 접두사 없음)
 */
export function absoluteLocaleUrl(locale: string, path: string): string {
  const p = path.startsWith('/') ? path : path ? `/${path}` : ''
  if (!p) return `${SITE_URL}/${locale}`
  return `${SITE_URL}/${locale}${p}`
}

/**
 * hreflang 맵 (Google / Bing / Naver 등 다국어 신호)
 * x-default → 영어(기본 로케일)
 */
export function hreflangAlternates(path: string): Record<string, string> {
  const normalized =
    path === '' || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`
  const langs: Record<string, string> = {}
  for (const loc of routing.locales) {
    langs[loc] =
      normalized === '' ? `${SITE_URL}/${loc}` : `${SITE_URL}/${loc}${normalized}`
  }
  langs['x-default'] =
    normalized === '' ? `${SITE_URL}/en` : `${SITE_URL}/en${normalized}`
  return langs
}

export function ogImageAbsoluteUrl(): string {
  return `${SITE_URL}/og-image.png`
}
