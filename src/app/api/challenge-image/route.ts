import { NextRequest } from 'next/server'
import { findAnimalImage, findArtGalleryImage, findFestivalImage, findNatureImage, findSkiingImage, findWikiImage } from '@/lib/wikiArtGalleryImage'

/** Nature 등 Wikipedia/Commons 다수 시도 시 10초 기본 타임아웃에 걸리지 않도록 연장 (이 라우트만 적용) */
export const maxDuration = 25

// 카테고리별 순차 처리 (한 카테고리 내에서만 간격 적용, 다른 카테고리 간 영향 없음)
const lastRunByCategory: Record<string, number> = {}
const MIN_GAP_MS: Record<string, number> = {
  art_galleries: 250,
  nature: 100,
  islands: 100,
  animals: 100,
  festivals: 100,
  golf: 100,
  fishing: 100,
  surfing: 100,
  skiing: 100,
  scuba: 100,
}
/** API로 이미지 조회하는 카테고리 → Wikipedia 검색 힌트 */
const WIKI_HINT: Record<string, string> = {
  nature: 'nature',
  islands: 'island',
  animals: 'animal species',
  festivals: 'festival',
  golf: 'golf course',
  fishing: 'fishing',
  surfing: 'surfing wave',
  skiing: 'ski resort',
  scuba: 'scuba diving',
}

/** 성공한 URL만 서버 메모리 캐시 (재요청/새로고침 시 즉시 반환, Wikipedia 재호출 방지) */
const serverImageCache = new Map<string, string>()

function cacheKey(category: string, titleEn: string): string {
  return `${category}:${titleEn}`
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category')
  const titleEn = request.nextUrl.searchParams.get('titleEn')?.trim()
  const allowed = [
    'art_galleries', 'nature', 'islands', 'animals', 'festivals',
    'golf', 'fishing', 'surfing', 'skiing', 'scuba',
  ]
  if (!category || !allowed.includes(category) || !titleEn) {
    return Response.json({ error: `Missing or invalid category or titleEn` }, { status: 400 })
  }

  const key = cacheKey(category, titleEn)
  const cached = serverImageCache.get(key)
  if (cached != null) {
    return Response.json({ url: cached })
  }

  const gap = MIN_GAP_MS[category] ?? 200
  const lastRun = lastRunByCategory[category] ?? 0
  const now = Date.now()
  const wait = Math.max(0, gap - (now - lastRun))
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait))
  }
  lastRunByCategory[category] = Date.now()

  try {
    let url: string | null = null
    if (category === 'art_galleries') {
      url = await findArtGalleryImage(titleEn)
    } else if (category === 'nature') {
      url = await findNatureImage(titleEn)
    } else if (category === 'animals') {
      url = await findAnimalImage(titleEn)
    } else if (category === 'festivals') {
      url = await findFestivalImage(titleEn)
    } else if (category === 'skiing') {
      url = await findSkiingImage(titleEn)
    } else if (WIKI_HINT[category]) {
      url = await findWikiImage(titleEn, WIKI_HINT[category])
    }
    if (url) serverImageCache.set(key, url)
    return Response.json({ url: url ?? null })
  } catch {
    return Response.json({ url: null })
  }
}
