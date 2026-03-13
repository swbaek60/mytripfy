/**
 * 100 Art Galleries 전용: 서버에서만 사용. Wikipedia summary → 검색 문서 이미지 → Commons 검색 순으로 시도.
 * HEAD 검증 없음(정상 URL이 걸러지는 문제 방지). API route에서 순차 호출로 rate limit 완화.
 */

const FETCH_OPTIONS: RequestInit = {
  signal: AbortSignal.timeout(15000),
  headers: { 'User-Agent': 'MyTripfy/1.0 (https://mytripfy.com; travel challenge app)' },
}

async function wikiSummary(title: string): Promise<string | null> {
  if (!title.trim()) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const src = data?.thumbnail?.source
    return src ? src.replace(/\/\d+px-/, '/640px-') : null
  } catch {
    return null
  }
}

async function getFirstSearchResultTitle(query: string): Promise<string | null> {
  if (!query.trim()) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`,
      FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.query?.search?.[0]?.title ?? null
  } catch {
    return null
  }
}

/** 문서 제목으로 pageimages API에서 썸네일 URL 반환 (summary에 없을 때 유용) */
async function getPageImageFromTitle(articleTitle: string): Promise<string | null> {
  if (!articleTitle.trim()) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=640&format=json&origin=*`,
      FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null
    const page = Object.values(pages) as Array<{ thumbnail?: { source?: string } }>
    const src = page[0]?.thumbnail?.source
    return src ? src.replace(/\/\d+px-/, '/640px-') : null
  } catch {
    return null
  }
}

async function getPageImageTitles(articleTitle: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=images&format=json&origin=*`,
      FETCH_OPTIONS
    )
    if (!res.ok) return []
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return []
    const page = Object.values(pages) as Array<{ images?: Array<{ title: string }> }>
    const imgs = page[0]?.images
    return (imgs ?? []).map((i) => i.title).filter((t) => t.startsWith('File:'))
  } catch {
    return []
  }
}

async function getImageThumbUrl(fileTitle: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=thumburl&iiurlwidth=640&format=json&origin=*`,
      FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null
    const page = Object.values(pages) as Array<{ imageinfo?: Array<{ thumburl?: string }> }>
    return page[0]?.imageinfo?.[0]?.thumburl ?? null
  } catch {
    return null
  }
}

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

/** Commons에서 검색어로 파일 검색 후 첫 번째 이미지 썸네일 URL 반환 */
async function commonsSearchImage(query: string): Promise<string | null> {
  if (!query.trim()) return null
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json&origin=*`,
      FETCH_OPTIONS
    )
    if (!res.ok) return null
    const data = await res.json()
    const hits = data?.query?.search as Array<{ title: string }> | undefined
    if (!hits?.length) return null
    for (const hit of hits) {
      const title = hit.title
      if (!title?.startsWith('File:')) continue
      const infoRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=thumburl&iiurlwidth=640&format=json&origin=*`,
        FETCH_OPTIONS
      )
      if (!infoRes.ok) continue
      const infoData = await infoRes.json()
      const pages = infoData?.query?.pages
      if (!pages) continue
      const page = Object.values(pages) as Array<{ imageinfo?: Array<{ thumburl?: string }> }>
      const thumb = page[0]?.imageinfo?.[0]?.thumburl
      if (thumb) return thumb
    }
  } catch {
    // ignore
  }
  return null
}

/** 문서 제목으로 해당 위키 문서의 첫 번째 이미지 썸네일 URL 반환 */
async function getFirstImageFromArticle(articleTitle: string): Promise<string | null> {
  const titles = await getPageImageTitles(articleTitle)
  for (const fileTitle of titles.slice(0, 6)) {
    const url = await getImageThumbUrl(fileTitle)
    if (url) return url
  }
  return null
}

/**
 * Nature 전용: 제목·언더스코어·검색 문서명 순으로 시도 후 Commons에서 자연/풍경 검색어 다수 시도.
 * (findWikiImage만 쓰면 실패가 많아서, animals/festivals와 동일하게 강화 + Commons 검색어 확대)
 */
export async function findNatureImage(titleEn: string): Promise<string | null> {
  const base = titleEn.replace(/\u2018|\u2019|\u201A/g, "'").trim()
  const withUnderscore = base.replace(/\s+/g, '_')
  const shortForm = base.includes(',') ? base.split(',')[0].trim() : base

  let url = await wikiSummary(base)
  if (url) return url
  url = await wikiSummary(withUnderscore)
  if (url) return url

  const articleTitle =
    (await getFirstSearchResultTitle(`${base} nature`)) ??
    (await getFirstSearchResultTitle(base)) ??
    (shortForm !== base ? await getFirstSearchResultTitle(shortForm) : null) ??
    (shortForm.length >= 3 ? await getFirstSearchResultTitle(`${shortForm} landscape`) : null)
  if (articleTitle) {
    url = await wikiSummary(articleTitle)
    if (url) return url
    url = await getPageImageFromTitle(articleTitle)
    if (url) return url
    url = await getFirstImageFromArticle(articleTitle)
    if (url) return url
  }

  const commonsPhrases =
    shortForm.length >= 3
      ? [
          base,
          `${base} nature`,
          shortForm,
          `${shortForm} landscape`,
          `${shortForm} view`,
          `${shortForm} national park`,
          `${shortForm} mountain`,
        ]
      : [base, `${base} nature`, shortForm]
  for (const phrase of commonsPhrases) {
    const fromCommons = await commonsSearchImage(phrase)
    if (fromCommons) return fromCommons
  }

  return null
}

/**
 * 100 Animals 전용: Wikipedia summary 우선(제목·언더스코어·검색 정확 문서명 순), 실패 시 findWikiImage 폴백.
 * summary 썸네일이 안정적으로 나오도록 여러 제목 형식 시도.
 */
export async function findAnimalImage(titleEn: string): Promise<string | null> {
  const base = titleEn.replace(/\u2018|\u2019|\u201A/g, "'").trim()
  const withUnderscore = base.replace(/\s+/g, '_')

  let url = await wikiSummary(base)
  if (url) return url
  url = await wikiSummary(withUnderscore)
  if (url) return url

  const articleTitle =
    (await getFirstSearchResultTitle(`${base} animal`)) ??
    (await getFirstSearchResultTitle(base)) ??
    (await getFirstSearchResultTitle(withUnderscore.replace(/_/g, ' ')))
  if (articleTitle) {
    url = await wikiSummary(articleTitle)
    if (url) return url
    url = await getPageImageFromTitle(articleTitle)
    if (url) return url
    url = await getFirstImageFromArticle(articleTitle)
    if (url) return url
  }

  return findWikiImage(titleEn, 'animal species')
}

/**
 * 100 Festivals 전용: Wikipedia summary 우선(제목·언더스코어·검색 문서명 순), 실패 시 findWikiImage 폴백.
 */
export async function findFestivalImage(titleEn: string): Promise<string | null> {
  const base = titleEn.replace(/\u2018|\u2019|\u201A/g, "'").trim()
  const withUnderscore = base.replace(/\s+/g, '_')

  let url = await wikiSummary(base)
  if (url) return url
  url = await wikiSummary(withUnderscore)
  if (url) return url

  const articleTitle =
    (await getFirstSearchResultTitle(`${base} festival`)) ??
    (await getFirstSearchResultTitle(base)) ??
    (await getFirstSearchResultTitle(withUnderscore.replace(/_/g, ' ')))
  if (articleTitle) {
    url = await wikiSummary(articleTitle)
    if (url) return url
    url = await getPageImageFromTitle(articleTitle)
    if (url) return url
    url = await getFirstImageFromArticle(articleTitle)
    if (url) return url
  }

  return findWikiImage(titleEn, 'festival')
}

/**
 * 100 Ski Resorts 전용: 제목의 스키장 이미지만 검색 (일반 제목 검색 시 다른 이미지가 나오는 경우 방지).
 * "X ski resort" / "X ski" 검색 → 해당 문서 이미지 → summary → Commons "X ski resort" 순.
 */
export async function findSkiingImage(titleEn: string): Promise<string | null> {
  const base = titleEn.replace(/\u2018|\u2019|\u201A/g, "'").trim()
  const shortForm = base.includes(',') ? base.split(',')[0].trim() : base

  const searchPhrases = [
    `${base} ski resort`,
    `${shortForm} ski resort`,
    `${base} ski`,
    `${shortForm} ski`,
  ]
  for (const phrase of searchPhrases) {
    const articleTitle = await getFirstSearchResultTitle(phrase)
    if (articleTitle) {
      const fromPage = await getPageImageFromTitle(articleTitle)
      if (fromPage) return fromPage
      const fromFirst = await getFirstImageFromArticle(articleTitle)
      if (fromFirst) return fromFirst
    }
  }

  const fromSummary = await wikiSummary(base)
  if (fromSummary) return fromSummary
  if (shortForm !== base) {
    const fromSummaryShort = await wikiSummary(shortForm)
    if (fromSummaryShort) return fromSummaryShort
  }

  const fromCommons =
    (await commonsSearchImage(`${base} ski resort`)) ??
    (await commonsSearchImage(`${shortForm} ski resort`)) ??
    (await commonsSearchImage(`${base} ski`)) ??
    (shortForm.length >= 3 ? await commonsSearchImage(`${shortForm} ski`) : null) ??
    (await commonsSearchImage(base))
  if (fromCommons) return fromCommons

  return findWikiImage(titleEn, 'ski resort')
}

/**
 * 제목 + 검색 힌트로 Wikipedia/Commons 이미지 탐색 (islands, animals, festivals, golf 등 공용).
 * summary → 검색 문서 pageimage → 문서 첫 이미지 → Commons 검색 순.
 */
export async function findWikiImage(titleEn: string, searchHint: string): Promise<string | null> {
  const base = titleEn.replace(/\u2018|\u2019|\u201A/g, "'").trim()
  const shortForm = base.includes(',') ? base.split(',')[0].trim() : base
  const withHint = searchHint ? `${base} ${searchHint}` : base

  const fromSummary = await wikiSummary(base)
  if (fromSummary) return fromSummary

  const fromSummaryShort = shortForm !== base ? await wikiSummary(shortForm) : null
  if (fromSummaryShort) return fromSummaryShort

  const articleTitle =
    (await getFirstSearchResultTitle(withHint)) ??
    (await getFirstSearchResultTitle(base)) ??
    (shortForm !== base ? await getFirstSearchResultTitle(shortForm) : null)
  if (articleTitle) {
    const fromPageImages = await getPageImageFromTitle(articleTitle)
    if (fromPageImages) return fromPageImages
    const fromFirst = await getFirstImageFromArticle(articleTitle)
    if (fromFirst) return fromFirst
  }

  const fromCommons =
    (await commonsSearchImage(base)) ??
    (await commonsSearchImage(withHint)) ??
    (shortForm.length >= 3 ? await commonsSearchImage(shortForm) : null) ??
    (shortForm.length >= 3 ? await commonsSearchImage(`${shortForm} landscape`) : null) ??
    (shortForm.length >= 3 ? await commonsSearchImage(`${shortForm} view`) : null)
  if (fromCommons) return fromCommons

  return null
}

/**
 * Art gallery 제목으로 이미지 URL 탐색.
 * summary → pageimages → 검색 문서 이미지 → Commons 검색(다중 쿼리) 순.
 */
export async function findArtGalleryImage(titleEn: string): Promise<string | null> {
  const base = titleEn.replace(/\u2018|\u2019|\u201A/g, "'").trim()
  const withHint = `${base} art gallery`
  const firstWord = base.split(/[\s,]+/)[0] || base

  const fromSummary = await wikiSummary(base)
  if (fromSummary) return fromSummary

  const fromSummaryHint = await wikiSummary(withHint)
  if (fromSummaryHint) return fromSummaryHint

  const articleTitle = await getFirstSearchResultTitle(withHint) ?? await getFirstSearchResultTitle(base)
  if (articleTitle) {
    const fromPageImages = await getPageImageFromTitle(articleTitle)
    if (fromPageImages) return fromPageImages
    const fromPage = await getBestArtGalleryImageFromArticle(articleTitle)
    if (fromPage) return fromPage
  }

  const fromCommons =
    (await commonsSearchImage(withHint)) ??
    (await commonsSearchImage(base)) ??
    (firstWord.length >= 3 ? await commonsSearchImage(`${firstWord} art gallery`) : null) ??
    (firstWord.length >= 3 ? await commonsSearchImage(`${firstWord} museum`) : null)
  if (fromCommons) return fromCommons

  return null
}
