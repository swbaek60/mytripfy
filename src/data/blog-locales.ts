/** 블로그 전문 번역이 제공되는 로케일 (en/ko는 messages/*.json 기본) */
export const BLOG_TRANSLATED_LOCALES = [
  'en',
  'ko',
  'ja',
  'zh',
  'zh-TW',
  'es',
  'fr',
  'de',
  'pt',
  'pt-BR',
  'it',
  'th',
  'vi',
  'id',
  'ru',
] as const

export type BlogTranslatedLocale = (typeof BLOG_TRANSLATED_LOCALES)[number]
