export interface Language {
  code: string
  name: string
  nativeName: string
  emoji: string
}

export interface LanguageLevel {
  code: string
  label: string
  labelKo: string
  color: string
  bgColor: string
  textColor: string
  stars: number
}

export interface LanguageSkill {
  lang: string
  level: string
}

// 앱에서 지원하는 25개 로케일 언어 (우선 표시)
export const LANGUAGES: Language[] = [
  { code: 'en',    name: 'English',                   nativeName: 'English',          emoji: '🇬🇧' },
  { code: 'ko',    name: 'Korean',                    nativeName: '한국어',             emoji: '🇰🇷' },
  { code: 'zh',    name: 'Chinese (Simplified)',       nativeName: '中文(简体)',          emoji: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)',     nativeName: '中文(繁體)',          emoji: '🇹🇼' },
  { code: 'ja',    name: 'Japanese',                  nativeName: '日本語',             emoji: '🇯🇵' },
  { code: 'es',    name: 'Spanish',                   nativeName: 'Español',           emoji: '🇪🇸' },
  { code: 'pt',    name: 'Portuguese',                nativeName: 'Português',         emoji: '🇵🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)',       nativeName: 'Português (Brasil)',emoji: '🇧🇷' },
  { code: 'fr',    name: 'French',                    nativeName: 'Français',          emoji: '🇫🇷' },
  { code: 'de',    name: 'German',                    nativeName: 'Deutsch',           emoji: '🇩🇪' },
  { code: 'it',    name: 'Italian',                   nativeName: 'Italiano',          emoji: '🇮🇹' },
  { code: 'nl',    name: 'Dutch',                     nativeName: 'Nederlands',        emoji: '🇳🇱' },
  { code: 'pl',    name: 'Polish',                    nativeName: 'Polski',            emoji: '🇵🇱' },
  { code: 'sv',    name: 'Swedish',                   nativeName: 'Svenska',           emoji: '🇸🇪' },
  { code: 'ru',    name: 'Russian',                   nativeName: 'Русский',           emoji: '🇷🇺' },
  { code: 'uk',    name: 'Ukrainian',                 nativeName: 'Українська',        emoji: '🇺🇦' },
  { code: 'tr',    name: 'Turkish',                   nativeName: 'Türkçe',            emoji: '🇹🇷' },
  { code: 'ar',    name: 'Arabic',                    nativeName: 'العربية',           emoji: '🇸🇦' },
  { code: 'fa',    name: 'Persian / Farsi',           nativeName: 'فارسی',             emoji: '🇮🇷' },
  { code: 'hi',    name: 'Hindi',                     nativeName: 'हिन्दी',             emoji: '🇮🇳' },
  { code: 'bn',    name: 'Bengali',                   nativeName: 'বাংলা',             emoji: '🇧🇩' },
  { code: 'id',    name: 'Indonesian',                nativeName: 'Bahasa Indonesia',  emoji: '🇮🇩' },
  { code: 'ms',    name: 'Malay',                     nativeName: 'Bahasa Melayu',     emoji: '🇲🇾' },
  { code: 'vi',    name: 'Vietnamese',                nativeName: 'Tiếng Việt',        emoji: '🇻🇳' },
  { code: 'th',    name: 'Thai',                      nativeName: 'ภาษาไทย',           emoji: '🇹🇭' },
  // 추가 언어
  { code: 'no',    name: 'Norwegian',                 nativeName: 'Norsk',             emoji: '🇳🇴' },
  { code: 'da',    name: 'Danish',                    nativeName: 'Dansk',             emoji: '🇩🇰' },
  { code: 'fi',    name: 'Finnish',                   nativeName: 'Suomi',             emoji: '🇫🇮' },
  { code: 'he',    name: 'Hebrew',                    nativeName: 'עברית',             emoji: '🇮🇱' },
  { code: 'tl',    name: 'Tagalog / Filipino',        nativeName: 'Filipino',          emoji: '🇵🇭' },
  { code: 'ta',    name: 'Tamil',                     nativeName: 'தமிழ்',              emoji: '🇮🇳' },
  { code: 'ur',    name: 'Urdu',                      nativeName: 'اردو',              emoji: '🇵🇰' },
  { code: 'sw',    name: 'Swahili',                   nativeName: 'Kiswahili',         emoji: '🇹🇿' },
  { code: 'other', name: 'Other',                     nativeName: 'Other',             emoji: '🌐' },
]

export const LANGUAGE_LEVELS: LanguageLevel[] = [
  { code: 'native',       label: 'Native',       labelKo: '원어민',  color: 'bg-purple-600', bgColor: 'bg-purple-50',  textColor: 'text-purple-700', stars: 5 },
  { code: 'fluent',       label: 'Fluent',        labelKo: '유창',   color: 'bg-blue-600',   bgColor: 'bg-blue-50',    textColor: 'text-blue-700',   stars: 4 },
  { code: 'intermediate', label: 'Intermediate',  labelKo: '중급',   color: 'bg-green-600',  bgColor: 'bg-green-50',   textColor: 'text-green-700',  stars: 3 },
  { code: 'basic',        label: 'Basic',         labelKo: '초급',   color: 'bg-gray-500',   bgColor: 'bg-gray-100',   textColor: 'text-gray-600',   stars: 2 },
]

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find(l => l.code === code)
}

export function getLevelInfo(code: string): LanguageLevel {
  return LANGUAGE_LEVELS.find(l => l.code === code) || LANGUAGE_LEVELS[3]
}

export function getLevelStars(code: string): string {
  const lvl = getLevelInfo(code)
  return '★'.repeat(lvl.stars) + '☆'.repeat(5 - lvl.stars)
}
