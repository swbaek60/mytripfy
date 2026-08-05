/**
 * 일일 로테이션 — 정책: scripts/lib/sns-rotation-policy.mjs
 * - 같은 날 4장: 동일 OOTD·악세서리
 * - 전날과 다른 의상
 * - 최근 9일 재착용 금지, 10일 후 재착용 가능 (~50벌 연간 순환)
 * - 날짜마다 다른 관광 variant
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DAYS_PER_COUNTRY } from './sns-campaign-config.mjs'
import {
  findOutfitIndexBySummary,
  getCatalogList,
  getOutfitByIndex,
} from './sns-ootd-catalog.mjs'
import { ROTATION_POLICY } from './sns-rotation-policy.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_OUT_DIR = path.join(__dirname, '..', 'out')

/** @typedef {import('./sns-weather.mjs').WeatherBand} WeatherBand */

export function getDayInCountryVisit(day1Based) {
  const span = Math.max(1, Math.floor(DAYS_PER_COUNTRY))
  return (day1Based - 1) % span
}

/** @param {import('./sns-ootd-catalog.mjs').DayOutfit} outfit */
function outfitText(outfit) {
  return [...outfit.pieces, ...outfit.accessories].map((p) => `${p.item} ${p.colors}`).join(' ').toLowerCase()
}

/** 더위·여행 맥락에 어울리지 않는 정장·출장·겨울룩 */
const SUMMER_TRAVEL_UNREALISTIC =
  /blazer|suit jacket|briefcase|oxford shoe|dress shirt|dress pants|slacks|wool coat|turtleneck|puffer|flannel|ankle boot|plaid wool|beanie|winter warm|work boot/i

/**
 * OOTD 선택용 날씨 밴드 — 여름 장마(28°C+)에도 가벼운 여행 코디 풀 유지
 * @param {{ band: WeatherBand, rainy: boolean, maxC?: number }} weather
 */
function effectiveBandForOutfit(weather) {
  const max = weather.maxC ?? 20
  if (max >= 28) return 'hot'
  if (weather.rainy && max >= 22) return max >= 26 ? 'warm' : 'rainy'
  return weather.rainy ? 'rainy' : weather.band
}

/** @param {'sua'|'ethan'} character @param {import('./sns-ootd-catalog.mjs').DayOutfit} outfit @param {{ band: WeatherBand, rainy: boolean, maxC?: number }} weather */
export function isOutfitUnrealisticForWeather(character, outfit, weather) {
  const max = weather.maxC ?? 20
  const text = outfitText(outfit)
  const summerTrip = max >= 26 || weather.band === 'hot' || (weather.band === 'warm' && max >= 24)
  if (!summerTrip) return false
  if (SUMMER_TRAVEL_UNREALISTIC.test(text)) return true
  if (character === 'sua' && /turtleneck|wool midi|ankle boot|plaid wool/i.test(text)) return true
  if (character === 'ethan' && /blazer|briefcase|oxford|dress shirt|beanie|work boot/i.test(text)) return true
  return false
}

/** @param {'sua'|'ethan'} character @param {{ band: WeatherBand, rainy: boolean, maxC?: number }} weather */
export function getWeatherAppropriateOutfitIndices(character, weather) {
  const list = getCatalogList(character)
  const key = effectiveBandForOutfit(weather)
  let tagged = list
    .map((o, i) => ({ i, o, tags: o.weatherTags || ['mild'] }))
    .filter(({ tags }) => tags.includes(key))
    .map(({ i }) => i)

  if (key === 'hot' || key === 'warm' || (weather.maxC ?? 0) >= 26) {
    tagged = tagged.filter((i) => !isOutfitUnrealisticForWeather(character, list[i], weather))
  }

  if (!tagged.length) {
    tagged = list
      .map((_, i) => i)
      .filter((i) => !isOutfitUnrealisticForWeather(character, list[i], weather))
  }

  return tagged.length ? tagged : list.map((_, i) => i)
}

const WEATHER_BAND_EXPAND_ORDER = ['hot', 'warm', 'rainy', 'mild', 'cool', 'cold']

/** hot 풀 고갈 시 warm·rainy 등 순차 확장 (회피·실루엇 선택지 확보) */
export function getExpandedWeatherOutfitIndices(character, weather) {
  const list = getCatalogList(character)
  const primary = effectiveBandForOutfit(weather)
  const order = [primary, ...WEATHER_BAND_EXPAND_ORDER.filter((b) => b !== primary)]
  const seen = new Set()
  /** @type {number[]} */
  const result = []
  for (const band of order) {
    for (let i = 0; i < list.length; i++) {
      if (seen.has(i)) continue
      const tags = list[i].weatherTags || ['mild']
      if (!tags.includes(band)) continue
      if (isOutfitUnrealisticForWeather(character, list[i], weather)) continue
      seen.add(i)
      result.push(i)
    }
  }
  if (result.length) return result
  return list
    .map((_, i) => i)
    .filter((i) => !isOutfitUnrealisticForWeather(character, list[i], weather))
}

const outfitPickMemo = new Map()

function getCampaignStartDate() {
  const env = process.env.SNS_CAMPAIGN_START
  const d = env ? new Date(env) : new Date('2026-05-22')
  d.setHours(0, 0, 0, 0)
  return d
}

/** @param {number} day1Based */
export function dateStrForCampaignDay(day1Based) {
  const d = getCampaignStartDate()
  d.setDate(d.getDate() + day1Based - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** @param {'sua'|'ethan'} character @param {number} day1Based */
function loadOutfitIndexFromMeta(character, day1Based) {
  if (day1Based < 1) return -1
  const outDir = process.env.SNS_OUT_DIR || DEFAULT_OUT_DIR
  const metaPath = path.join(outDir, dateStrForCampaignDay(day1Based), 'meta.json')
  if (!fs.existsSync(metaPath)) return -1
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    const o = meta[character]?.outfit
    if (typeof o?.index === 'number') return o.index
    if (o?.summaryKo || o?.summaryEn) {
      return findOutfitIndexBySummary(character, o.summaryKo, o.summaryEn)
    }
  } catch {
    /* ignore */
  }
  return -1
}

/**
 * 최근 N일(기본 9일) 동안 입었던 의상 인덱스 — 10일째부터는 목록에 없음(재착용 허용)
 * @param {'sua'|'ethan'} character
 * @param {number} day1Based
 * @param {number} [lookbackDays]
 */
export function loadRecentOutfitAvoid(character, day1Based, lookbackDays = ROTATION_POLICY.OUTFIT_SHORT_TERM_AVOID_DAYS) {
  const avoid = new Set()
  for (let offset = 1; offset <= lookbackDays; offset++) {
    const prevDay = day1Based - offset
    if (prevDay < 1) break
    const idx = loadOutfitIndexFromMeta(character, prevDay)
    if (idx >= 0) avoid.add(idx)
  }
  return avoid
}

/** @deprecated — loadRecentOutfitAvoid 사용 */
export function loadPublishedOutfitAvoid(character, day1Based, lookback = ROTATION_POLICY.OUTFIT_SHORT_TERM_AVOID_DAYS) {
  return loadRecentOutfitAvoid(character, day1Based, lookback)
}

/** @param {import('./sns-ootd-catalog.mjs').DayOutfit} outfit — 실루엣 카테고리 (연속 날짜 같은 스타일 방지) */
export function outfitSilhouetteKey(outfit) {
  const text = outfitText(outfit)
  if (/\bshorts\b/i.test(text) && !/dress/i.test(text)) return 'shorts-set'
  if (/(wide-leg|linen pants|cargo pants|trousers|slacks|travel pants)/i.test(text) && !/dress/i.test(text))
    return 'pants-set'
  if (/\bskirt\b/i.test(text) && !/dress/i.test(text)) return 'skirt-set'
  if (/co-ord|coord|jumpsuit/i.test(text)) return 'coord-set'
  if (/(blazer|utility jacket|denim jacket)/i.test(text) && /(jeans|tee|top|shirt)/i.test(text)) return 'layered-casual'
  if (/dress/i.test(text)) return 'dress'
  return 'other'
}

/**
 * 시각적 중복 방지 — travel jacket #N 변형·같은 색 재킷+카키 등 Generate에서 똑같이 보이는 조합 차단
 * @param {import('./sns-ootd-catalog.mjs').DayOutfit} outfit
 */
export function outfitVisualKey(outfit) {
  const text = outfitText(outfit)
  const top = outfit.pieces[0]
  const bottom = outfit.pieces.find((p) => /pants|jeans|chinos|slacks|shorts|skirt|trousers/i.test(p.item))
  const bag = outfit.accessories.find((a) => /bag|backpack|briefcase|tote|daypack/i.test(a.item))

  if (/travel jacket/i.test(text) && /(khaki|travel pants)/i.test(text)) {
    return `travel-jacket-set|${(top?.colors || '').toLowerCase()}|${(bag?.item || 'bag').toLowerCase()}`
  }
  if (/blazer/i.test(text)) {
    return `blazer-set|${(top?.colors || '').toLowerCase()}|${(bottom?.colors || '').toLowerCase()}|${(bag?.item || '').toLowerCase()}`
  }
  if (/field jacket|bomber|windbreaker|utility jacket|leather jacket|overshirt|flannel/i.test(text)) {
    return `outerwear|${(top?.item || '').toLowerCase()}|${(top?.colors || '').toLowerCase()}|${(bottom?.item || '').toLowerCase()}`
  }
  return `${outfitSilhouetteKey(outfit)}|${(top?.item || '').toLowerCase()}|${(top?.colors || '').toLowerCase()}|${(outfit.colorAccent || '').toLowerCase()}`
}

/** @param {import('./sns-ootd-catalog.mjs').DayOutfit} a @param {import('./sns-ootd-catalog.mjs').DayOutfit} b */
export function isVisuallySimilarOutfit(a, b) {
  if (outfitVisualKey(a) === outfitVisualKey(b)) return true
  const ta = outfitText(a)
  const tb = outfitText(b)
  const outerA = /(blazer|travel jacket|field jacket|bomber|windbreaker|utility jacket|leather jacket|overshirt|flannel)/i.test(ta)
  const outerB = /(blazer|travel jacket|field jacket|bomber|windbreaker|utility jacket|leather jacket|overshirt|flannel)/i.test(tb)
  if (!outerA || !outerB) return false
  const neutralBottom = /(khaki|charcoal|beige|stone|neutral|travel pants|slacks|chinos)/i
  return neutralBottom.test(ta) && neutralBottom.test(tb)
}

/** @param {number[]} indices @param {import('./sns-ootd-catalog.mjs').DayOutfit[]} list @param {import('./sns-ootd-catalog.mjs').DayOutfit|null} avoidOutfit */
function preferNotVisuallySimilar(indices, list, avoidOutfit) {
  if (!avoidOutfit) return indices
  const different = indices.filter((i) => !isVisuallySimilarOutfit(list[i], avoidOutfit))
  return different.length ? different : indices
}

/** @param {number[]} indices @param {import('./sns-ootd-catalog.mjs').DayOutfit[]} list @param {string|null} avoidSilhouette */
function preferDifferentSilhouette(indices, list, avoidSilhouette) {
  if (!avoidSilhouette) return indices
  const different = indices.filter((i) => outfitSilhouetteKey(list[i]) !== avoidSilhouette)
  return different.length ? different : indices
}

/** @param {'sua'|'ethan'} character @param {number} day1Based @param {number} outfitIdx */
function lastWornDaysAgo(character, day1Based, outfitIdx) {
  for (let offset = 1; offset <= ROTATION_POLICY.OUTFIT_SHORT_TERM_AVOID_DAYS; offset++) {
    const prevDay = day1Based - offset
    if (prevDay < 1) break
    if (loadOutfitIndexFromMeta(character, prevDay) === outfitIdx) return offset
  }
  return ROTATION_POLICY.OUTFIT_REUSE_AFTER_DAYS
}

/**
 * @param {'sua'|'ethan'} character
 * @param {number} day1Based
 * @param {{ band: WeatherBand, rainy: boolean, maxC?: number }} weather
 */
export function pickDailyOutfitIndex(character, day1Based, weather) {
  const cacheKey = `${character}:${day1Based}:${weather.band}:${weather.rainy}:${weather.maxC ?? ''}`
  if (outfitPickMemo.has(cacheKey)) return outfitPickMemo.get(cacheKey)

  const list = getCatalogList(character)
  const candidates = getExpandedWeatherOutfitIndices(character, weather)
  const avoid = loadRecentOutfitAvoid(character, day1Based)
  const yesterdayIdx = loadOutfitIndexFromMeta(character, day1Based - 1)
  const yesterdayOutfit = yesterdayIdx >= 0 ? list[yesterdayIdx] : null
  const yesterdaySilhouette = yesterdayOutfit ? outfitSilhouetteKey(yesterdayOutfit) : null
  const yesterdayVisual = yesterdayOutfit ? outfitVisualKey(yesterdayOutfit) : null

  /** @param {number[]} pool */
  function tryPick(pool) {
    let stylePool = preferDifferentSilhouette(pool, list, yesterdaySilhouette)
    stylePool = preferNotVisuallySimilar(stylePool, list, yesterdayOutfit)
    const notAvoided = (c) => !avoid.has(c) && c !== yesterdayIdx
    const tiers = [
      stylePool.filter(notAvoided),
      preferNotVisuallySimilar(pool.filter(notAvoided), list, yesterdayOutfit),
      pool.filter(notAvoided),
    ]
    for (const tier of tiers) {
      if (tier.length) return tier[day1Based % tier.length]
    }
    return null
  }

  let idx = tryPick(candidates)

  if (idx === null) {
    // 9일 회피 풀 소진 — 가장 오래 전에 입은 코디 (10일+ 재착용)
    const reuse = candidates
      .filter((c) => c !== yesterdayIdx)
      .sort((a, b) => lastWornDaysAgo(character, day1Based, b) - lastWornDaysAgo(character, day1Based, a))
    idx = reuse[0] ?? candidates.find((c) => c !== yesterdayIdx) ?? candidates[0] ?? 0
  }

  if (yesterdaySilhouette && outfitSilhouetteKey(list[idx]) === yesterdaySilhouette) {
    const alt = candidates.find(
      (c) =>
        c !== idx &&
        c !== yesterdayIdx &&
        !avoid.has(c) &&
        outfitSilhouetteKey(list[c]) !== yesterdaySilhouette
    )
    if (alt !== undefined) idx = alt
  }

  if (yesterdayOutfit && isVisuallySimilarOutfit(list[idx], yesterdayOutfit)) {
    const alt = candidates.find(
      (c) =>
        c !== idx &&
        c !== yesterdayIdx &&
        !avoid.has(c) &&
        !isVisuallySimilarOutfit(list[c], yesterdayOutfit)
    )
    if (alt !== undefined) idx = alt
  }

  if (yesterdayVisual && outfitVisualKey(list[idx]) === yesterdayVisual) {
    const alt = candidates.find(
      (c) =>
        c !== idx &&
        c !== yesterdayIdx &&
        !avoid.has(c) &&
        outfitVisualKey(list[c]) !== yesterdayVisual
    )
    if (alt !== undefined) idx = alt
  }

  outfitPickMemo.set(cacheKey, idx)
  return idx
}

export function clearOutfitPickMemo() {
  outfitPickMemo.clear()
}

/** @param {'sua'|'ethan'} character @param {number} day1Based @param {Awaited<ReturnType<import('./sns-weather.mjs').fetchCityWeather>>} weather */
export function resolveDailyOutfit(character, day1Based, weather) {
  const idx = pickDailyOutfitIndex(character, day1Based, weather)
  return getOutfitByIndex(character, idx)
}
