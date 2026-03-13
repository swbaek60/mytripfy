/**
 * 챌린지 다국어: 핵심 언어(en, ko)는 DB에 미리 저장, 나머지는 en 폴백.
 * 추후 다른 언어는 자동번역 후 이 테이블에 캐시하면 됨.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decodeHtmlEntities } from '@/lib/utils'

/** 지원 locale (URL/선택 가능). DB에 번역이 있는 언어: PRELOADED_LOCALES. 나머지는 en 폴백 */
export const SUPPORTED_LOCALES = [
  'en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'it', 'ru',
  'ar', 'hi', 'th', 'vi', 'id', 'ms', 'tr', 'pl', 'nl', 'sv',
  'da', 'no', 'fi', 'el', 'he',
] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

/**
 * DB에 미리 번역이 채워진 기본 언어 (en, ko + 5~7개).
 * 시드 스크립트(scripts/seed-challenge-translations)로 ja,zh,es,fr,de,pt,it 채우기.
 */
export const PRELOADED_LOCALES: readonly string[] = [
  'en', 'ko', 'ja', 'zh', 'zh-TW', 'es', 'fr', 'de', 'pt', 'it',
]

/**
 * 제목이 고유명사(레스토랑·장소·코스명·동물명 등)인 카테고리.
 * 이 카테고리는 locale과 관계없이 제목을 원문(title_en)으로 표시 (연금술사 → Alchemist, 침팬지 → Chimpanzee 유지).
 * animals 포함 시 이미지 조회(ANIMALS_DIRECT_IMAGES 키=title_en)와 표시가 일치함.
 */
export const TITLE_ORIGINAL_CATEGORIES = new Set([
  'restaurants', 'attractions', 'museums', 'art_galleries', 'islands',
  'golf', 'surfing', 'scuba', 'fishing', 'skiing', 'nature', 'festivals',
  'foods', 'drinks', 'animals',
])

export interface ChallengeWithLocale {
  id: string
  category: string
  country_code: string | null
  points: number
  title_en: string
  title: string
  description: string | null
}

/**
 * 카테고리별 챌린지 목록을 locale에 맞는 title/description으로 반환.
 * 번역 없으면 en 폴백.
 */
export async function getChallengesForCategoryWithLocale(
  supabase: SupabaseClient,
  category: string,
  locale: string
): Promise<ChallengeWithLocale[]> {
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id, category, country_code, points, title_en')
    .eq('category', category)
    .order('points', { ascending: false })
    .order('title_en', { ascending: true })

  if (!challenges?.length) return []

  const ids = challenges.map(c => c.id)
  const langs = [locale, 'en'].filter((v, i, a) => a.indexOf(v) === i)

  const { data: rows } = await supabase
    .from('challenge_translations')
    .select('challenge_id, lang, title, description')
    .in('challenge_id', ids)
    .in('lang', langs)

  const byId = new Map<string, Map<string, { title: string; description: string | null }>>()
  for (const r of rows || []) {
    if (!byId.has(r.challenge_id)) byId.set(r.challenge_id, new Map())
    byId.get(r.challenge_id)!.set(r.lang, { title: r.title, description: r.description ?? null })
  }

  return challenges.map(c => {
    const tr = byId.get(c.id)
    const preferred = tr?.get(locale) ?? tr?.get('en')
    const enTr = tr?.get('en')
    const useOriginalTitle = TITLE_ORIGINAL_CATEGORIES.has(c.category)
    // 설명: 선택 언어에 번역이 없거나 비어 있으면 영어 설명으로 폴백 (ko/zh/ja 시드 전까지 빈칸 방지)
    const descRaw = (preferred?.description != null && String(preferred.description).trim() !== '')
      ? preferred.description
      : (enTr?.description != null && String(enTr.description).trim() !== '' ? enTr.description : null)
    return {
      id: c.id,
      category: c.category,
      country_code: c.country_code,
      points: c.points,
      title_en: c.title_en,
      title: useOriginalTitle ? c.title_en : decodeHtmlEntities(preferred?.title ?? c.title_en),
      description: descRaw != null ? decodeHtmlEntities(descRaw) : null,
    }
  })
}

/**
 * challenge_id 목록에 대해 locale(및 en 폴백) 번역 맵 반환.
 * 피드/디스퓨트 등에서 챌린지 제목만 필요할 때 사용.
 * 고유명사 카테고리는 제목을 원문(title_en)으로 반환.
 */
export async function getTranslationsForChallenges(
  supabase: SupabaseClient,
  challengeIds: string[],
  locale: string
): Promise<Map<string, { title: string; description: string | null }>> {
  if (challengeIds.length === 0) return new Map()
  const langs = [locale, 'en'].filter((v, i, a) => a.indexOf(v) === i)
  const [{ data: rows }, { data: challenges }] = await Promise.all([
    supabase.from('challenge_translations').select('challenge_id, lang, title, description').in('challenge_id', challengeIds).in('lang', langs),
    supabase.from('challenges').select('id, category, title_en').in('id', challengeIds),
  ])
  const challengeById = new Map((challenges || []).map(c => [c.id, c]))

  const byId = new Map<string, Map<string, { title: string; description: string | null }>>()
  for (const r of rows || []) {
    if (!byId.has(r.challenge_id)) byId.set(r.challenge_id, new Map())
    byId.get(r.challenge_id)!.set(r.lang, { title: r.title, description: r.description ?? null })
  }

  const result = new Map<string, { title: string; description: string | null }>()
  for (const id of challengeIds) {
    const ch = challengeById.get(id)
    const tr = byId.get(id)
    const preferred = tr?.get(locale) ?? tr?.get('en')
    const enTr = tr?.get('en')
    const descRaw = (preferred?.description != null && String(preferred.description).trim() !== '')
      ? preferred.description
      : (enTr?.description != null && String(enTr.description).trim() !== '' ? enTr.description : null)
    if (preferred || ch) {
      const useOriginalTitle = ch ? TITLE_ORIGINAL_CATEGORIES.has(ch.category) : false
      const title = useOriginalTitle && ch ? ch.title_en : (preferred ? decodeHtmlEntities(preferred.title) : ch?.title_en ?? '')
      result.set(id, {
        title,
        description: descRaw != null ? decodeHtmlEntities(descRaw) : null,
      })
    }
  }
  return result
}
