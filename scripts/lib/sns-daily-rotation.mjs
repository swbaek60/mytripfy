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
  getCatalogLength,
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

  const candidates = getWeatherAppropriateOutfitIndices(character, weather)
  const avoid = loadRecentOutfitAvoid(character, day1Based)
  const yesterdayIdx = loadOutfitIndexFromMeta(character, day1Based - 1)
  const catalogLen = getCatalogLength(character)

  const open = candidates.filter((c) => !avoid.has(c))
  let idx

  if (open.length > 0) {
    idx = open[day1Based % open.length]
  } else {
    // 날씨 후보 중 가장 오래 전에 입은 코디 우선 (2일 전·어제 코디 회피)
    const weatherReuse = candidates
      .filter((c) => c !== yesterdayIdx)
      .sort((a, b) => lastWornDaysAgo(character, day1Based, b) - lastWornDaysAgo(character, day1Based, a))
    idx = weatherReuse[0] ?? candidates.find((c) => c !== yesterdayIdx) ?? candidates[0] ?? 0
  }

  if (yesterdayIdx >= 0 && idx === yesterdayIdx) {
    const alt = candidates.find((c) => c !== yesterdayIdx) ?? (idx + 1) % catalogLen
    idx = alt
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
