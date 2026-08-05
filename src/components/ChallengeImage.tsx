'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { cleanTitle } from '@/lib/challenge-image/title'
import {
  getCategoryImageConfig,
  CACHE_VERSION,
  getPersistentCacheKeys,
  getCategoryCacheKey,
  getPerItemCacheKey,
} from '@/lib/challenge-image/config'

/** Wikimedia 원본 URL → 썸네일 URL (브라우저가 직접 로드 → Vercel Origin Transfer 없음) */
function wikimediaThumbUrl(url: string, width = 320): string {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('wikimedia.org')) return url
    if (u.pathname.includes('/thumb/')) {
      const resized = u.pathname.replace(/\/\d+px-/, `/${width}px-`)
      return resized !== u.pathname ? `${u.origin}${resized}` : url
    }
    const m = u.pathname.match(/^(\/wikipedia\/[^/]+\/)([^/]+\/[^/]+\/)(.+)$/)
    if (m) {
      const fileName = m[3]
      return `${u.origin}${m[1]}thumb/${m[2]}${fileName}/${width}px-${fileName}`
    }
    return url
  } catch {
    return url
  }
}

/** 이미지 src. Wikimedia는 썸네일 직접 로드 우선, 실패 시 image-proxy 폴백 */
function imageSrc(url: string, useDirect: boolean, category: string): string {
  if (url.startsWith('/')) return url
  const isWiki =
    url.startsWith('https://upload.wikimedia.org/') || url.startsWith('https://commons.wikimedia.org/')
  if (isWiki) {
    const conf = getCategoryImageConfig(category)
    const baseUrl =
      category === 'countries' ? url : conf.useCanonicalProxy ? wikimediaThumbToCanonical(url) : url
    if (useDirect) return wikimediaThumbUrl(baseUrl, 320)
    return `/api/image-proxy?url=${encodeURIComponent(baseUrl)}`
  }
  return url
}

function isWikimediaUrl(url: string): boolean {
  return url.startsWith('https://upload.wikimedia.org/') || url.startsWith('https://commons.wikimedia.org/')
}

/** Wikimedia 썸네일 URL을 원본(캐노니컬) URL로 변환. thumb 경로 404/변경 시 프록시 안정화 */
function wikimediaThumbToCanonical(url: string): string {
  try {
    const u = new URL(url)
    if (!u.pathname.includes('/thumb/')) return url
    const newPath = u.pathname.replace(/\/thumb\/(.+)\/\d+px-[^/]+$/, '/$1')
    if (newPath === u.pathname) return url
    return u.origin + newPath
  } catch {
    return url
  }
}

const CATEGORY_GRADIENTS: Record<string, { from: string; to: string; emoji: string }> = {
  attractions:  { from: '#f59e0b', to: '#d97706', emoji: '🏛️' },
  foods:        { from: '#ef4444', to: '#dc2626', emoji: '🍜' },
  restaurants:  { from: '#8b5cf6', to: '#7c3aed', emoji: '🍽️' },
  golf:         { from: '#10b981', to: '#059669', emoji: '⛳' },
  countries:    { from: '#3b82f6', to: '#2563eb', emoji: '🌍' },
  nature:       { from: '#14b8a6', to: '#0d9488', emoji: '🏔️' },
  animals:      { from: '#f97316', to: '#ea580c', emoji: '🦁' },
  festivals:    { from: '#ec4899', to: '#db2777', emoji: '🎭' },
  museums:      { from: '#6366f1', to: '#4f46e5', emoji: '🏺' },
  art_galleries:{ from: '#a855f7', to: '#9333ea', emoji: '🖼️' },
  drinks:       { from: '#f59e0b', to: '#b45309', emoji: '🍶' },
  islands:      { from: '#0ea5e9', to: '#0284c7', emoji: '🏝️' },
  fishing:      { from: '#06b6d4', to: '#0891b2', emoji: '🎣' },
  surfing:      { from: '#3b82f6', to: '#4f46e5', emoji: '🏄' },
  skiing:       { from: '#94a3b8', to: '#64748b', emoji: '⛷️' },
  scuba:        { from: '#1d4ed8', to: '#0f766e', emoji: '🤿' },
}

// Category-specific search hints for Wikipedia
const CATEGORY_HINTS: Record<string, string> = {
  // restaurants: 대표 음식·내부·전경 우선 (건물 외관·국기 회피)
  restaurants:  'restaurant dish food interior dining',
  golf:         'golf course',
  surfing:      'surfing wave',
  skiing:       'ski resort',
  scuba:        'scuba diving',
  fishing:      'fishing',
  animals:      'animal species',
  festivals:    'festival',
  museums:      'museum',
  art_galleries:'art gallery',
  islands:      'island',
  drinks:       'bottle label product drink beverage alcohol wine spirit whisky champagne beer',
  nature:       'nature',
  attractions:  'landmark',
  countries:    '',
  foods:        'food dish plate cuisine',
}

// ═══════════════════════════════════════════════════════════════════════════════
// 직접 이미지: 카테고리별 *_DIRECT_IMAGES 맵만 수정. 로딩 전략/캐시는 @/lib/challenge-image/config.ts
// ═══════════════════════════════════════════════════════════════════════════════


// Wikimedia 정책: API 요청 시 User-Agent 필수. 없으면 403 등으로 차단될 수 있음.
const WIKI_FETCH_OPTIONS: RequestInit = {
  signal: AbortSignal.timeout(12000),
  headers: { 'User-Agent': 'MyTripfy/1.0 (https://mytripfy.com; travel challenge app)' },
}

async function wikiSummary(title: string): Promise<string | null> {
  if (!title.trim()) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      WIKI_FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const src = data?.thumbnail?.source
    return src ? src.replace(/\/\d+px-/, '/640px-') : null
  } catch { return null }
}

async function wikiSearch(query: string): Promise<string | null> {
  if (!query.trim()) return null
  try {
    const firstTitle = await getFirstSearchResultTitle(query)
    if (!firstTitle) return null
    return wikiSummary(firstTitle)
  } catch { return null }
}

/** Wikipedia 검색 결과 첫 번째 문서 제목만 반환 (썸네일 없이). art_galleries 폴백 등에서 사용 */
async function getFirstSearchResultTitle(query: string): Promise<string | null> {
  if (!query.trim()) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`,
      WIKI_FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const firstTitle = data?.query?.search?.[0]?.title
    return firstTitle ?? null
  } catch { return null }
}

// ─── 100 Drinks 전용: 문서 내 이미지 중 병/제품 이미지 직접 선택 (대표 이미지=건물/인물 회피)
const DRINK_IMAGE_GOOD = /\b(bottle|bouteille|wine|whisky|whiskey|beer|rum|vodka|gin|tequila|mezcal|cognac|champagne|label|product|glass|cuvee|cuvée|malt|spirit|sake|soju|liquor|liqueur|scotch|bourbon|brandy|armagnac|sherry|port|ale|lager|stout|bock|weiss|hefe|verre|flasche|fles)\b/i
const DRINK_IMAGE_BAD = /\b(building|exterior|interior|facade|vineyard|cellar|person|people|portrait|couple|man\s+and|woman\s+and|team|group|map|location|aerial|street|town|estate\s+view|castle|chateau\s*exterior|domaine\s*building|wedding|event|promotion)\b/i

async function getPageImageTitles(articleTitle: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=images&format=json&origin=*`,
      WIKI_FETCH_OPTIONS
    )
    if (!res.ok) return []
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return []
    const page = Object.values(pages) as Array<{ images?: Array<{ title: string }> }>
    const imgs = page[0]?.images
    return (imgs ?? []).map((i) => i.title).filter((t) => t.startsWith('File:'))
  } catch { return [] }
}

function scoreDrinkImageFilename(fileTitle: string): number {
  const name = fileTitle.replace(/^File:/i, '').replace(/\.[a-z]+$/i, '')
  const lower = name.toLowerCase()
  if (DRINK_IMAGE_BAD.test(lower)) return -10
  if (DRINK_IMAGE_GOOD.test(lower)) return 10
  if (/\d{3,}px/.test(lower) || /thumb|icon|logo|svg/.test(lower)) return 0
  return 1
}

async function getImageThumbUrl(fileTitle: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=thumburl&iiurlwidth=640&format=json&origin=*`,
      WIKI_FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null
    const page = Object.values(pages) as Array<{ imageinfo?: Array<{ thumburl?: string }> }>
    const thumb = page[0]?.imageinfo?.[0]?.thumburl
    return thumb ?? null
  } catch { return null }
}

/** 100 Drinks: 위키 문서에 포함된 이미지 중 병/제품 이미지 우선 선택 후 썸네일 URL 반환 */
async function getBestDrinkImageFromArticle(articleTitle: string): Promise<string | null> {
  const titles = await getPageImageTitles(articleTitle)
  if (titles.length === 0) return null
  const scored = titles
    .map((t) => ({ title: t, score: scoreDrinkImageFilename(t) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
  const toTry = scored.length > 0 ? scored.map((x) => x.title) : titles
  for (const fileTitle of toTry.slice(0, 6)) {
    const url = await getImageThumbUrl(fileTitle)
    if (url) return url
  }
  return null
}

// 100 Art Galleries: 문서 내 이미지 중 갤러리/건물/전시 이미지 우선 (인물·초상화 회피)
const ART_GALLERY_IMAGE_GOOD = /\b(gallery|museum|building|exterior|interior|facade|entrance|hall|exhibition|art|collection|wing|view|night|day|aerial)\b/i
const ART_GALLERY_IMAGE_BAD = /\b(person|people|portrait|painting|drawing|sculpture|artist|director|curator|man\s+and|woman\s+and|team|group|logo|icon|map|diagram|svg)\b/i

function scoreArtGalleryImageFilename(fileTitle: string): number {
  const name = fileTitle.replace(/^File:/i, '').replace(/\.[a-z]+$/i, '')
  const lower = name.toLowerCase()
  if (ART_GALLERY_IMAGE_BAD.test(lower)) return -5
  if (ART_GALLERY_IMAGE_GOOD.test(lower)) return 10
  if (/\d{3,}px/.test(lower) || /thumb|icon|logo|svg/.test(lower)) return 0
  return 1
}

/** 문서의 첫 번째 이미지 썸네일 URL (countries/foods 폴백용) */
async function getFirstImageFromArticle(articleTitle: string): Promise<string | null> {
  const titles = await getPageImageTitles(articleTitle)
  if (titles.length === 0) return null
  const url = await getImageThumbUrl(titles[0])
  return url ?? (titles.length > 1 ? await getImageThumbUrl(titles[1]) : null)
}

/** 100 Art Galleries: summary 썸네일 없을 때 문서 이미지 목록에서 갤러리/건물 이미지 선택 */
async function getBestArtGalleryImageFromArticle(articleTitle: string): Promise<string | null> {
  const titles = await getPageImageTitles(articleTitle)
  if (titles.length === 0) return null
  const scored = titles
    .map((t) => ({ title: t, score: scoreArtGalleryImageFilename(t) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
  const toTry = scored.length > 0 ? scored.map((x) => x.title) : titles
  for (const fileTitle of toTry.slice(0, 8)) {
    const url = await getImageThumbUrl(fileTitle)
    if (url) return url
  }
  return null
}



// Main image finder — tries multiple strategies, returns first hit
//
// 직접 URL 표와 위키 문서 오버라이드는 서버에서 조회해 prop 으로 받는다
// (articles/countryArticles). 예전에는 이 함수 안에서 같은 표를 한 번 더 확인했지만,
// 호출부가 이미 직접 URL 이 없을 때만 여기로 오기 때문에 항상 빈손으로 통과하던
// 코드였고, 그 표들이 클라이언트 번들 390KB 를 차지했다.
async function findImage(
  titleEn: string,
  category: string,
  articles?: {
    /** 이 항목에 지정된 위키 문서 후보 */
    wiki?: string[]
    /** 100 Countries 전용 문서 후보 */
    country?: string[]
  }
): Promise<string | null> {
  // ── Step 0a2: 100 Countries 전용 — 국가명이 위키에서 다른 항목(미국 주 Georgia 등)으로 오인될 때 문서 지정
  if (category === 'countries' && articles?.country?.length) {
    for (const article of articles.country) {
      const u = await wikiSummary(article) ?? await wikiSearch(article)
      if (u) return u
    }
  }

  // ── Step 0b: curated overrides for items that Wikipedia can't match reliably
  const overrides = articles?.wiki
  if (overrides?.length) {
    const toTry = category === 'drinks' ? overrides.slice(0, 4) : overrides
    for (const article of toTry) {
      // 100 Drinks: 문서 내 이미지 목록에서 병/제품 이미지 직접 선택 (대표 이미지=건물/인물 회피)
      if (category === 'drinks') {
        const drinkImg = await getBestDrinkImageFromArticle(article)
        if (drinkImg) return drinkImg
      }
      const result = await Promise.any([
        wikiSummary(article),
        wikiSearch(article),
      ].map(p => p.then(r => r ?? Promise.reject())))
        .catch(() => null)
      if (result) return result
    }
  }

  // ── Step 0c: 100 Drinks 전용 — 제품/병 이미지 검색 (bottle, drink, label 등)
  if (category === 'drinks') {
    const drinkBase = cleanTitle(titleEn)
    const firstTwo = drinkBase.split(' ').slice(0, 2).join(' ')
    const drinkQueries = [
      `${drinkBase} bottle`,
      `${drinkBase} drink`,
      `${firstTwo} bottle`,
      `${drinkBase} label`,
      drinkBase,
    ]
    for (const q of drinkQueries) {
      const result = await wikiSearch(q)
      if (result) return result
    }
  }

  // ── Step 1: Location extraction for outdoor-activity spot categories
  // Many entries follow "Species/Wave/Feature, Location" format.
  // Using the LOCATION part gives scenic destination photos and prevents:
  //   • Fish anatomy images (same species → duplicate photos across multiple spots)
  //   • Wave diagrams instead of beautiful ocean/beach scenes
  //   • Generic dive-site icons instead of vivid coral/underwater scenes
  const LOCATION_EXTRACT_CATS = new Set(['fishing', 'surfing', 'scuba'])
  if (LOCATION_EXTRACT_CATS.has(category) && titleEn.includes(',')) {
    const locationPart = titleEn.split(',').slice(1).join(',').trim()
    // Skip if the location token is too short (e.g. "BC", "PNG") — those have overrides above
    if (locationPart.length >= 5) {
      const locResult = await Promise.any([
        wikiSummary(locationPart),
        wikiSearch(locationPart),
      ].map(p => p.then(r => r ?? Promise.reject())))
        .catch(() => null)
      if (locResult) return locResult
    }
  }

  // restaurants: "Restaurant/Cafe/Hotel" 제거 시 사람 이름·브랜드로 오인됨
  // golf:        "Golf Club/Links/Course" 제거 시 마을·정치인 등 엉뚱한 항목으로 연결됨
  // islands:     "Island" 제거 또는 괄호 삭제 시 국가 페이지·엉뚱한 섬으로 연결됨
  // art_galleries: "(art gallery)" 유지 시 검색 정확도 상승
  const useFullTitle = category === 'restaurants' || category === 'golf' || category === 'fishing' || category === 'islands' || category === 'art_galleries'
  const baseTitle = useFullTitle ? titleEn : cleanTitle(titleEn)

  const hint = CATEGORY_HINTS[category] ?? ''
  const firstTwo = baseTitle.split(' ').slice(0, 2).join(' ')
  const firstThree = baseTitle.split(' ').slice(0, 3).join(' ')

  // Restaurants: Wikipedia summary API often 404s for "X (restaurant)" — try short form first
  const noSuffix = category === 'restaurants' ? baseTitle.replace(/\s*\(restaurant\)\s*$/i, '').trim() : ''
  const tryShortFirst = noSuffix && noSuffix !== baseTitle

  // Round 1: try 3–5 approaches in PARALLEL (restaurants get short-title attempts first)
  const round1Candidates: Promise<string | null>[] = [
    wikiSummary(baseTitle),
    wikiSearch(`${baseTitle} ${hint}`.trim()),
    wikiSummary(firstThree),
  ]
  if (tryShortFirst) {
    round1Candidates.unshift(wikiSummary(noSuffix), wikiSearch(`${noSuffix} ${hint}`.trim()))
  }
  const round1 = await Promise.any(round1Candidates.map(p => p.then(r => r ?? Promise.reject())))
    .catch(() => null)

  if (round1) return round1

  // Round 2: more aggressive — search without category hint, try shorter titles
  const round2 = await Promise.any([
    wikiSearch(baseTitle),
    wikiSummary(firstTwo),
    wikiSearch(firstThree),
  ].map(p => p.then(r => r ?? Promise.reject())))
    .catch(() => null)

  if (round2) return round2

  // Round 3: last resort — category-context-only search
  if (hint) {
    const shortTitle = titleEn.split(' ')[0]
    const result = await wikiSearch(`${shortTitle} ${hint}`)
    if (result) return result
  }

  // Round 4: 검색으로 문서 제목만 얻은 뒤 해당 문서의 첫 이미지 사용 (summary에 썸네일 없는 경우 많음)
  const searchQuery = hint ? `${baseTitle} ${hint}`.trim() : baseTitle
  const articleTitle = await getFirstSearchResultTitle(searchQuery) ?? await getFirstSearchResultTitle(baseTitle)
  if (articleTitle) {
    if (category === 'countries' || category === 'foods') {
      const firstImg = await getFirstImageFromArticle(articleTitle)
      if (firstImg) return firstImg
    }
  }

  // 100 Art Galleries: 문서 내 이미지 중 갤러리/건물 우선 선택 (Round 4에서 얻은 articleTitle 재사용)
  if (category === 'art_galleries' && articleTitle) {
    const fromPage = await getBestArtGalleryImageFromArticle(articleTitle)
    if (fromPage) return fromPage
  }

  return null
}

// ─── Global request queue (foods/restaurants 등 위키 API 사용 시에만 사용) ──
let activeRequests = 0
const MAX_CONCURRENT = 4
/** 기본 동시 요청 수. countries/foods는 config.maxConcurrent로 100 사용 */
const requestQueue: Array<() => void> = []
/** 실패 시 1회만 재시도 (countries/foods/art_galleries) */
const retriedIds = new Set<string>()

function processQueue(maxConcurrent?: number) {
  const limit = maxConcurrent ?? MAX_CONCURRENT
  while (activeRequests < limit && requestQueue.length > 0) {
    const next = requestQueue.shift()!
    activeRequests++
    next()
  }
}

function cacheKey(id: string) { return getPerItemCacheKey(id) }

/** Art Galleries 전용: 한 키에 id→url 맵 저장. config에서 persistent 키 사용 → 다른 카테고리 버전 올려도 삭제 안 됨 */
function getArtGalleriesCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(getCategoryCacheKey('art_galleries'))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
// 쓰기 직렬화: 여러 컴포넌트가 동시에 저장할 때 마지막 쓰기가 이전 항목을 덮어쓰지 않도록
let artGalleriesCacheWritePending: Promise<void> = Promise.resolve()
function setArtGalleriesCacheEntry(id: string, url: string) {
  artGalleriesCacheWritePending = artGalleriesCacheWritePending.then(() => {
    try {
      const map = getArtGalleriesCache()
      map[id] = url
      localStorage.setItem(getCategoryCacheKey('art_galleries'), JSON.stringify(map))
    } catch { /* ignore */ }
  })
}

// ─── 100 Nature Spots 전용 캐시 (art_galleries와 동일 패턴, 다른 카테고리와 완전 분리) ──
const NATURE_CACHE_KEY = `cimg_${CACHE_VERSION}_nature`
function getNatureCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NATURE_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
let natureCacheWritePending: Promise<void> = Promise.resolve()
function setNatureCacheEntry(id: string, url: string) {
  natureCacheWritePending = natureCacheWritePending.then(() => {
    try {
      const map = getNatureCache()
      map[id] = url
      localStorage.setItem(NATURE_CACHE_KEY, JSON.stringify(map))
    } catch { /* ignore */ }
  })
}

// ─── 카테고리별 캐시 (키는 config 기준, 한 카테고리 수정 시 다른 카테고리 영향 없음) ──
function getCategoryCache(cat: string): Record<string, string> {
  if (cat === 'nature') return getNatureCache()
  try {
    const raw = localStorage.getItem(getCategoryCacheKey(cat))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
const categoryCacheWritePending: Record<string, Promise<void>> = {}
function setCategoryCacheEntry(cat: string, id: string, url: string) {
  if (cat === 'nature') {
    setNatureCacheEntry(id, url)
    return
  }
  if (!categoryCacheWritePending[cat]) categoryCacheWritePending[cat] = Promise.resolve()
  categoryCacheWritePending[cat] = categoryCacheWritePending[cat].then(() => {
    try {
      const map = getCategoryCache(cat)
      map[id] = url
      localStorage.setItem(getCategoryCacheKey(cat), JSON.stringify(map))
    } catch { /* ignore */ }
  })
}

/** 깨진 이미지 URL이 캐시에 있으면 제거 (다음 로드 시 재시도 또는 failed 표시) */
function removeCategoryCacheEntry(cat: string, id: string) {
  if (cat === 'nature') return
  try {
    const map = getCategoryCache(cat)
    delete map[id]
    localStorage.setItem(getCategoryCacheKey(cat), JSON.stringify(map))
  } catch { /* ignore */ }
}


// 앱 로드 시 한 번만 예전 버전 캐시 삭제. persistent 키(config)는 제외 → 카테고리별 수정이 다른 카테고리 깨짐 방지
let oldCachePurged = false
function purgeOldImageCache() {
  if (oldCachePurged || typeof localStorage === 'undefined') return
  oldCachePurged = true
  try {
    const prefix = `cimg_${CACHE_VERSION}_`
    const persistent = new Set(getPersistentCacheKeys())
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('cimg_')) continue
      if (key.startsWith(prefix)) continue
      if (persistent.has(key)) continue
      toRemove.push(key)
    }
    toRemove.forEach(k => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

// ─── Component ─────────────────────────────────────────────────────────────
interface Props {
  id: string
  titleEn: string
  category: string
  countryCode?: string | null
  className?: string
  /**
   * 서버에서 미리 확정한 직접 이미지 URL (`resolveChallengeImageHints`).
   *
   * 이전에는 컴포넌트가 직접 URL 표를 들고 와서 렌더 중 여러 번 조회했다.
   * 표가 순수 데이터라 서버에서 한 번 조회해 넘기는 것으로 충분하고,
   * 그 덕에 클라이언트 번들에서 약 390KB 가 빠졌다.
   */
  directUrl?: string | null
  /** 위키 검색이 엉뚱한 문서를 잡는 항목의 후보 문서명 (서버에서 조회). */
  wikiArticles?: string[]
  /** 100 Countries 전용 후보 문서명. */
  countryArticles?: string[]
}

export default function ChallengeImage({
  id,
  titleEn,
  category,
  countryCode,
  className = '',
  directUrl = null,
  wikiArticles,
  countryArticles,
}: Props) {
  const cat = CATEGORY_GRADIENTS[category] ?? { from: '#6b7280', to: '#4b5563', emoji: '🌟' }
  const key = cacheKey(id)

  // countries 카테고리: countryCode가 있으면 flagcdn.com 직접 사용 (프록시/API 불필요, 신뢰성 높음)
  const flagCdnUrl = category === 'countries' && countryCode
    ? `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`
    : undefined

  // 직접 URL 있으면 초기값으로 설정. 캐시는 useEffect에서만 읽음 (SSR/클라이언트 일치로 hydration 오류 방지)
  const [imgUrl, setImgUrl] = useState<string | 'loading' | 'failed'>(
    () => flagCdnUrl ?? directUrl ?? 'loading'
  )
  const [useDirectUrl, setUseDirectUrl] = useState(true)
  const usedRestaurantDirectRef = useRef(false)

  // findImage 는 effect 의 의존성에 들어가므로 매 렌더 새 객체를 만들면 재요청이 돈다.
  const articles = useMemo(
    () => ({ wiki: wikiArticles, country: countryArticles }),
    [wikiArticles, countryArticles]
  )

  useEffect(() => { setUseDirectUrl(true) }, [id])

  useEffect(() => {
    purgeOldImageCache()
    try {
      // countries: countryCode가 있으면 flagcdn.com 직접 사용 (재마운트 시에도 유지)
      if (flagCdnUrl) {
        setImgUrl(flagCdnUrl)
        try { localStorage.setItem(key, flagCdnUrl) } catch { /* ignore */ }
        return
      }
      const conf = getCategoryImageConfig(category)
      if (directUrl) {
        setImgUrl(directUrl)
        if (conf.cacheStrategy === 'per_item') try { localStorage.setItem(key, directUrl) } catch { /* ignore */ }
        return
      }
      // 개발 시 원인 분석: direct URL이 없으면 콘솔에 titleEn 출력 (DB와 매핑 키 불일치 확인)
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && category === 'foods') {
        console.log('[ChallengeImage] foods 매핑 없음:', JSON.stringify(titleEn))
      }
      if (conf.fetchStrategy === 'none') return
      if (conf.cacheStrategy === 'category_persistent') {
        const url = getArtGalleriesCache()[id]
        if (url) { setImgUrl(url); return }
        return
      }
      if (conf.cacheStrategy === 'category_versioned') {
        const url = getCategoryCache(category)[id]
        if (url) { setImgUrl(url); return }
        return
      }
      const cached = localStorage.getItem(key)
      if (cached && cached !== 'failed') {
        setImgUrl(cached)
        usedRestaurantDirectRef.current = category === 'restaurants' && directUrl === cached
        return
      }
    } catch { /* ignore */ }
  }, [key, category, titleEn, id, flagCdnUrl, directUrl])

  const containerRef = useRef<HTMLDivElement>(null)

  // 카테고리별 분기 (한 카테고리 수정 시 해당 블록만 변경할 것, 다른 카테고리 로직 건드리지 말 것)
  // attractions/drinks/museums: 직접 URL 또는 공용 key 캐시만 사용, observer 없음
  // countries/foods: 공용 key 캐시 + findImage(클라이언트) 큐
  // API_IMAGE_CATEGORIES(nature, islands, animals, festivals, golf, fishing, surfing, skiing, scuba): 전용 캐시 + /api/challenge-image
  // art_galleries: 전용 캐시(ART_GALLERIES_CACHE_KEY) + 서버 API만 사용
  // 그 외(restaurants 등): observer + findImage
  useEffect(() => {
    if (imgUrl !== 'loading') return
    // 모든 카테고리: 직접 이미지가 있으면 우선 적용 후 종료
    const direct = directUrl
    if (direct) {
      setImgUrl(direct)
      try { localStorage.setItem(key, direct) } catch { /* ignore */ }
      return
    }
    if (getCategoryImageConfig(category).fetchStrategy === 'none') return

    // Countries (findImage + timeout): observer 없이 마운트 시 바로 큐에 넣어 한 번에 로드 (새로고침 없이 전부 표시)
    if (category === 'countries') {
      const doFetch = async () => {
        try {
          const url = await Promise.race([
            findImage(titleEn, category, articles),
            new Promise<string | null>((resolve) => setTimeout(() => resolve(null), getCategoryImageConfig('countries').fetchTimeoutMs || 0)),
          ])
          if (url) {
            setImgUrl(url)
            if (isWikimediaUrl(url)) setUseDirectUrl(true)
            try { localStorage.setItem(key, url) } catch { /* ignore */ }
          } else {
            setImgUrl('failed')
            try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            if (!retriedIds.has(id)) {
              retriedIds.add(id)
              setTimeout(() => { requestQueue.push(doFetch); processQueue(getCategoryImageConfig('countries').maxConcurrent) }, 2000)
            }
          }
        } catch {
          setImgUrl('failed')
          try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
          if (!retriedIds.has(id)) {
            retriedIds.add(id)
            setTimeout(() => { requestQueue.push(doFetch); processQueue(getCategoryImageConfig('countries').maxConcurrent) }, 2000)
          }
        } finally {
          activeRequests--
          processQueue(getCategoryImageConfig('countries').maxConcurrent)
        }
      }
      requestQueue.push(doFetch)
      processQueue(getCategoryImageConfig('countries').maxConcurrent)
      return
    }

    // 100 Foods: 직접 URL(사용자/폴백 맵) → 캐시 → findImage. 100개 동시 요청으로 위/아래 구분 없이 로드.
    if (category === 'foods') {
      try {
        const direct = directUrl
        if (direct) {
          setImgUrl(direct)
          try { localStorage.setItem(key, direct) } catch { /* ignore */ }
          return
        }
        const cached = localStorage.getItem(key)
        if (cached && cached !== 'failed') {
          setImgUrl(cached)
          return
        }
      } catch { /* ignore */ }
      const doFetch = async () => {
        try {
          const url = await findImage(titleEn, category, articles)
          if (url) {
            setImgUrl(url)
            if (isWikimediaUrl(url)) setUseDirectUrl(true)
            try { localStorage.setItem(key, url) } catch { /* ignore */ }
          } else {
            setImgUrl('failed')
            try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            if (!retriedIds.has(id)) {
              retriedIds.add(id)
              setTimeout(() => { requestQueue.push(doFetch); processQueue(getCategoryImageConfig('foods').maxConcurrent) }, 2000)
            }
          }
        } catch {
          setImgUrl('failed')
          try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
          if (!retriedIds.has(id)) {
            retriedIds.add(id)
            setTimeout(() => { requestQueue.push(doFetch); processQueue(getCategoryImageConfig('foods').maxConcurrent) }, 2000)
          }
        } finally {
          activeRequests--
          processQueue(getCategoryImageConfig('foods').maxConcurrent)
        }
      }
      requestQueue.push(doFetch)
      processQueue(getCategoryImageConfig('foods').maxConcurrent)
      return
    }

    // fetchStrategy === 'api': 전용 캐시 있으면 즉시 적용, 없으면 /api/challenge-image 호출 후 캐시 저장
    if (getCategoryImageConfig(category).fetchStrategy === 'api') {
      const cachedUrl = getCategoryCache(category)[id]
      if (cachedUrl) {
        setImgUrl(cachedUrl)
        if (isWikimediaUrl(cachedUrl)) setUseDirectUrl(true)
        return
      }
      const doFetch = async () => {
        try {
          const res = await fetch(
            `/api/challenge-image?category=${encodeURIComponent(category)}&titleEn=${encodeURIComponent(titleEn)}&id=${encodeURIComponent(id)}`
          )
          const data = await res.json().catch(() => ({}))
          const url = data?.url
          if (url) {
            setImgUrl(url)
            if (isWikimediaUrl(url)) setUseDirectUrl(true)
            setCategoryCacheEntry(category, id, url)
          } else {
            // 직접 URL이 있으면 failed로 덮어쓰지 않음 (새로고침 시 나왔다 사라지는 현상 방지)
            if (!directUrl) {
              setImgUrl('failed')
            }
            if (!retriedIds.has(id)) {
              retriedIds.add(id)
              setTimeout(() => { requestQueue.push(doFetch); processQueue() }, 2000)
            }
          }
        } catch {
          if (!directUrl) setImgUrl('failed')
          if (!retriedIds.has(id)) {
            retriedIds.add(id)
            setTimeout(() => { requestQueue.push(doFetch); processQueue() }, 2000)
          }
        } finally {
          activeRequests--
          processQueue()
        }
      }
      requestQueue.push(doFetch)
      processQueue()
      return
    }

    // 100 Art Galleries: 직접/MUSEUMS URL 없으면 서버 API (서버 캐시로 재요청 시 즉시 응답, 실패는 localStorage에 안 씀 → 새로고침 시 재시도)
    if (category === 'art_galleries') {
      const doFetch = async () => {
        try {
          const res = await fetch(
            `/api/challenge-image?category=art_galleries&titleEn=${encodeURIComponent(titleEn)}&id=${encodeURIComponent(id)}`
          )
          const data = await res.json().catch(() => ({}))
          const url = data?.url
          if (url) {
            setImgUrl(url)
            if (isWikimediaUrl(url) && category !== 'art_galleries') setUseDirectUrl(true)
            setArtGalleriesCacheEntry(id, url)
          } else {
            setImgUrl('failed')
            if (!retriedIds.has(id)) {
              retriedIds.add(id)
              setTimeout(() => { requestQueue.push(doFetch); processQueue() }, 2000)
            }
          }
        } catch {
          setImgUrl('failed')
          if (!retriedIds.has(id)) {
            retriedIds.add(id)
            setTimeout(() => { requestQueue.push(doFetch); processQueue() }, 2000)
          }
        } finally {
          activeRequests--
          processQueue()
        }
      }
      requestQueue.push(doFetch)
      processQueue()
      return
    }

    const loadImage = (visible: boolean) => {
      if (!visible) return

      if (category === 'foods') {
        try {
          const direct = directUrl
          if (direct) {
            setImgUrl(direct)
            try { localStorage.setItem(key, direct) } catch { /* ignore */ }
            return
          }
          const cached = localStorage.getItem(key)
          if (cached && cached !== 'failed') {
            setImgUrl(cached)
            return
          }
        } catch { /* ignore */ }
        const doFetch = async () => {
          try {
            const url = await findImage(titleEn, category, articles)
            if (url) {
              setImgUrl(url)
              try { localStorage.setItem(key, url) } catch { /* ignore */ }
            } else {
              setImgUrl('failed')
              try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            }
          } finally {
            activeRequests--
            processQueue()
          }
        }
        requestQueue.push(doFetch)
        processQueue()
        return
      }

      // 그 외(restaurants 등): 직접 이미지 우선, 없으면 findImage
      const directFallback = directUrl
      if (directFallback) {
        setImgUrl(directFallback)
        usedRestaurantDirectRef.current = category === 'restaurants'
        try { localStorage.setItem(key, directFallback) } catch { /* ignore */ }
        return
      }
      const doFetch = async () => {
        try {
          const url = await findImage(titleEn, category, articles)
          if (url) {
            // 여기까지 왔다는 것은 쓸 수 있는 직접 URL 이 없었다는 뜻이다 (위에서 early return).
            // 즉 이 이미지는 위키에서 온 것이므로 "직접 URL 사용" 플래그는 항상 false 다.
            usedRestaurantDirectRef.current = false
            setImgUrl(url)
            try { localStorage.setItem(key, url) } catch { /* ignore */ }
          } else {
            setImgUrl('failed')
            try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
          }
        } finally {
          activeRequests--
          processQueue()
        }
      }
      requestQueue.push(doFetch)
      processQueue()
    }

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        loadImage(true)
      },
      { root: null, rootMargin: '800px 0px 800px 0px', threshold: 0 }
    )

    // 다음 프레임에서 observe (레이아웃 완료 후 - 스크롤 시 콜백 보장)
    const rafId = requestAnimationFrame(() => {
      observer.observe(el)
    })
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [id, titleEn, category, imgUrl, key, directUrl, articles])

  const showGradient = imgUrl === 'loading' || imgUrl === 'failed'

  const handleImageError = () => {
    if (category === 'restaurants' && usedRestaurantDirectRef.current) {
      usedRestaurantDirectRef.current = false
      setImgUrl('loading')
      try { localStorage.removeItem(key) } catch { /* ignore */ }
      requestQueue.push(() => {
        const doFallback = async () => {
          try {
            const fallbackUrl = await findImage(titleEn, category, articles)
            if (fallbackUrl) {
              setImgUrl(fallbackUrl)
              try { localStorage.setItem(key, fallbackUrl) } catch { /* ignore */ }
            } else {
              setImgUrl('failed')
              try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            }
          } finally {
            activeRequests--
            processQueue()
          }
        }
        doFallback()
      })
      processQueue()
      return
    }
    // 100 Foods: 직접 URL 로드 실패 시 findImage 폴백 1회
    if (category === 'foods') {
      setImgUrl('loading')
      try { localStorage.removeItem(key) } catch { /* ignore */ }
      requestQueue.push(() => {
        const doFallback = async () => {
          try {
            const fallbackUrl = await findImage(titleEn, category, articles)
            if (fallbackUrl) {
              setImgUrl(fallbackUrl)
              try { localStorage.setItem(key, fallbackUrl) } catch { /* ignore */ }
            } else {
              setImgUrl('failed')
              try { localStorage.setItem(key, 'failed') } catch { /* ignore */ }
            }
          } finally {
            activeRequests--
            processQueue(getCategoryImageConfig('foods').maxConcurrent)
          }
        }
        doFallback()
      })
      processQueue(getCategoryImageConfig('foods').maxConcurrent)
      return
    }
    // Wikimedia: 직접 로드 실패 시 proxy로, proxy 실패 시 failed
    if (typeof imgUrl === 'string' && isWikimediaUrl(imgUrl)) {
      if (useDirectUrl) {
        setUseDirectUrl(false)
        return
      }
    }
    setImgUrl('failed')
    const conf = getCategoryImageConfig(category)
    if (conf.cacheStrategy === 'category_versioned') removeCategoryCacheEntry(category, id)
    if (conf.cacheStrategy === 'per_item') {
      try { localStorage.removeItem(key) } catch { /* ignore */ }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={showGradient ? { background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` } : undefined}
    >
      {showGradient ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 select-none">
          <span className="text-4xl drop-shadow">{cat.emoji}</span>
          {imgUrl === 'loading' && (
            <div className="flex gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- 위키미디어·flagcdn 등 임의 호스트라 허용 목록에 넣을 수 없다.
        <img
          src={imageSrc(imgUrl, useDirectUrl, category)}
          alt={titleEn}
          loading={getCategoryImageConfig(category).eagerLoad ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={handleImageError}
        />
      )}
    </div>
  )
}
