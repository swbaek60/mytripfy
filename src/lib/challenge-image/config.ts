/**
 * 챌린지 카테고리별 이미지 로딩 설정.
 * 한 카테고리 수정 시 다른 카테고리에 영향 없도록 카테고리마다 독립 설정.
 */

/** 캐시 전략: per_item = 항목별 키(cimg_버전_id), category_versioned = 카테고리 맵+버전, category_persistent = 카테고리 맵(버전 없음, purge 제외) */
export type CacheStrategy = 'per_item' | 'category_versioned' | 'category_persistent'

/** 직접 이미지 없을 때 사용할 소스: none = 없으면 실패, api = /api/challenge-image, findImage = Wikipedia/Commons 클라이언트 검색 */
export type FetchStrategy = 'none' | 'api' | 'findImage'

export interface CategoryImageConfig {
  id: string
  /** 직접 이미지 없을 때 캐시/추가 조회 전략 */
  cacheStrategy: CacheStrategy
  fetchStrategy: FetchStrategy
  /** Wikimedia URL을 프록시할 때 썸네일→캐노니컬 변환 여부 (nature/foods는 false로 URL 그대로) */
  useCanonicalProxy: boolean
  /** img loading="eager" 사용 여부 */
  eagerLoad: boolean
  /** findImage 사용 시 동시 요청 수 (countries/foods 100, 그 외 4) */
  maxConcurrent: number
  /** findImage 타임아웃(ms). 0이면 미적용 */
  fetchTimeoutMs: number
}

/** 전역 캐시 버전. 올리면 per_item / category_versioned 캐시만 무효화. category_persistent는 유지 */
export const CACHE_VERSION = 'v145'

const CONFIGS: Record<string, CategoryImageConfig> = {
  attractions: {
    id: 'attractions',
    cacheStrategy: 'per_item',
    fetchStrategy: 'none',
    useCanonicalProxy: true,
    eagerLoad: false,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  drinks: {
    id: 'drinks',
    cacheStrategy: 'per_item',
    fetchStrategy: 'none',
    useCanonicalProxy: true,
    eagerLoad: false,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  museums: {
    id: 'museums',
    cacheStrategy: 'per_item',
    fetchStrategy: 'none',
    useCanonicalProxy: true,
    eagerLoad: false,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  art_galleries: {
    id: 'art_galleries',
    cacheStrategy: 'category_persistent',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  nature: {
    id: 'nature',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: false,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  islands: {
    id: 'islands',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  animals: {
    id: 'animals',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  festivals: {
    id: 'festivals',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  golf: {
    id: 'golf',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  fishing: {
    id: 'fishing',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  surfing: {
    id: 'surfing',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  skiing: {
    id: 'skiing',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  scuba: {
    id: 'scuba',
    cacheStrategy: 'category_versioned',
    fetchStrategy: 'api',
    useCanonicalProxy: true,
    eagerLoad: true,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
  countries: {
    id: 'countries',
    cacheStrategy: 'per_item',
    fetchStrategy: 'findImage',
    useCanonicalProxy: true,
    eagerLoad: false, // 지연 로딩으로 동시 프록시 요청 줄여 깨짐 방지
    maxConcurrent: 100,
    fetchTimeoutMs: 15000,
  },
  foods: {
    id: 'foods',
    cacheStrategy: 'per_item',
    fetchStrategy: 'findImage',
    useCanonicalProxy: false,
    eagerLoad: false, // 지연 로딩으로 동시 프록시 요청 줄여 하단 이미지 깨짐 방지
    maxConcurrent: 100,
    fetchTimeoutMs: 0,
  },
  restaurants: {
    id: 'restaurants',
    cacheStrategy: 'per_item',
    fetchStrategy: 'findImage',
    useCanonicalProxy: true,
    eagerLoad: false,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  },
}

export function getCategoryImageConfig(category: string): CategoryImageConfig {
  const c = CONFIGS[category]
  if (c) return c
  return {
    id: category,
    cacheStrategy: 'per_item',
    fetchStrategy: 'none',
    useCanonicalProxy: true,
    eagerLoad: false,
    maxConcurrent: 4,
    fetchTimeoutMs: 0,
  }
}

/** purge 시 제외할 캐시 키(버전 올려도 삭제하지 않음). 카테고리별 수정이 다른 카테고리 깨짐 방지 */
export function getPersistentCacheKeys(): string[] {
  return ['cimg_art_galleries']
}

/** 카테고리별 캐시 키 반환 (버전 사용 여부는 config에 따름) */
export function getCategoryCacheKey(category: string): string {
  const config = getCategoryImageConfig(category)
  if (config.cacheStrategy === 'category_persistent') return 'cimg_art_galleries'
  if (config.cacheStrategy === 'category_versioned') return `cimg_${CACHE_VERSION}_${category}`
  return `cimg_${CACHE_VERSION}_${category}` // per_item은 항목별 키이므로 여기서는 category 맵용
}

export function getPerItemCacheKey(id: string): string {
  return `cimg_${CACHE_VERSION}_${id}`
}
