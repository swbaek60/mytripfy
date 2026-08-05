/**
 * 일차별 도시 날씨 조회 → OOTD 적합도 반영 (Open-Meteo, API 키 불필요)
 */
import { cloneOutfit, formatOutfitPromptLock } from './sns-ootd-catalog.mjs'
import { attachDetailLockToOutfit } from './sns-ootd-detail-lock.mjs'
import { pickDailyOutfitIndex } from './sns-daily-rotation.mjs'
import { getOutfitByIndex } from './sns-ootd-catalog.mjs'

/** @typedef {'hot'|'warm'|'mild'|'cool'|'cold'} WeatherBand */

/** @type {Record<string, { city: string, lat: number, lon: number, tz: string }>} */
export const COUNTRY_PRIMARY_CITY = {
  KR: { city: 'Seoul', lat: 37.5665, lon: 126.978, tz: 'Asia/Seoul' },
  JP: { city: 'Tokyo', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  CN: { city: 'Shanghai', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  HK: { city: 'Hong Kong', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  TW: { city: 'Taipei', lat: 25.033, lon: 121.5654, tz: 'Asia/Taipei' },
  US: { city: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  CA: { city: 'Toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  MX: { city: 'Mexico City', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  GT: { city: 'Guatemala City', lat: 14.6349, lon: -90.5069, tz: 'America/Guatemala' },
  GB: { city: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  FR: { city: 'Paris', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  TH: { city: 'Bangkok', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  VN: { city: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' },
  PA: { city: 'Panama City', lat: 8.9824, lon: -79.5199, tz: 'America/Panama' },
  CO: { city: 'Bogota', lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  CR: { city: 'San Jose', lat: 9.9281, lon: -84.0907, tz: 'America/Costa_Rica' },
  SG: { city: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  MY: { city: 'Kuala Lumpur', lat: 3.139, lon: 101.6869, tz: 'Asia/Kuala_Lumpur' },
  ID: { city: 'Jakarta', lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  PH: { city: 'Manila', lat: 14.5995, lon: 120.9842, tz: 'Asia/Manila' },
  AU: { city: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
}

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99])

const DRIZZLE_CODES = new Set([51, 53, 55, 56, 57])
const ACTIVE_RAIN_CODES = new Set([61, 63, 65, 66, 67, 80, 81, 82, 85, 86, 95, 96, 99])

const WMO_LABEL = {
  0: 'clear',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'heavy rain',
  71: 'snow',
  80: 'showers',
  95: 'thunderstorm',
}

/**
 * 우산 소지 여부 — 코디 rainy 밴드보다 엄격 (이슬비 0.1mm·코드만으로 우산 X)
 * @param {{ precip: number, code: number }} w
 */
export function shouldCarryUmbrella(w) {
  if (w.precip >= 1) return true
  if (ACTIVE_RAIN_CODES.has(w.code) && w.precip >= 0.5) return true
  if (DRIZZLE_CODES.has(w.code) && w.precip >= 1) return true
  if ([95, 96, 99].includes(w.code) && w.precip >= 0.3) return true
  return false
}

export function clearWeatherCache() {
  weatherCache.clear()
}

/**
 * @param {{ max: number, min: number, precip: number, code: number }} w
 * @returns {{ band: WeatherBand, rainy: boolean, carryUmbrella: boolean, label: string }}
 */
export function classifyWeather(w) {
  const rainy = w.precip >= 1 || RAIN_CODES.has(w.code)
  const carryUmbrella = shouldCarryUmbrella(w)
  let band
  if (w.max >= 28) band = 'hot'
  else if (w.max >= 22) band = 'warm'
  else if (w.max >= 16) band = 'mild'
  else if (w.max >= 10) band = 'cool'
  else band = 'cold'
  if (w.min < 12 && w.max >= 20) band = 'mild'
  if (w.min < 5 && w.max < 14) band = 'cold'
  if (rainy && (band === 'hot' || band === 'warm')) band = 'warm'
  const label = WMO_LABEL[w.code] || 'variable'
  return { band, rainy, carryUmbrella, label }
}


/** @param {string} promptScene */
export function cityFromPromptScene(promptScene) {
  if (!promptScene) return null
  const m = promptScene.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(Tokyo|Seoul|Osaka|Kyoto|Busan|Jeju|Paris|London|Berlin|Rome|Barcelona|Amsterdam|Zurich|Vienna|Prague|Budapest|Athens|Lisbon|Dublin|Edinburgh|Copenhagen|Stockholm|Oslo|Helsinki|Reykjavik|Dubai|Doha|Istanbul|Cairo|Marrakech|Cape Town|Nairobi|Lagos|Accra|Nairobi|Bangkok|Hanoi|Ho Chi Minh City|Singapore|Kuala Lumpur|Jakarta|Manila|Taipei|Hong Kong|Shanghai|Beijing|Sydney|Melbourne|Auckland|Toronto|Vancouver|Montreal|Calgary|New York|Brooklyn|Manhattan|Los Angeles|San Francisco|Chicago|Miami|Mexico City|Bogota|Lima|Rio de Janeiro|São Paulo|Buenos Aires)\b/)
  return m ? m[2] : null
}

/** @param {'sua'|'ethan'} character @param {string} countryCode @param {import('./sns-campaign-config.mjs').DayStop[]} stops */
export function resolveCity(character, countryCode, stops) {
  const fromScene = stops?.[0]?.promptScene && cityFromPromptScene(stops[0].promptScene)
  if (fromScene) {
    const base = COUNTRY_PRIMARY_CITY[countryCode]
    return {
      city: fromScene,
      lat: base?.lat ?? 0,
      lon: base?.lon ?? 0,
      tz: base?.tz ?? 'UTC',
      countryCode,
    }
  }
  const primary = COUNTRY_PRIMARY_CITY[countryCode]
  if (primary) return { ...primary, countryCode }
  return { city: countryCode, lat: 20, lon: 0, tz: 'UTC', countryCode }
}

const weatherCache = new Map()

/**
 * @param {{ city: string, lat: number, lon: number, tz: string }} loc
 * @param {string} dateStr YYYY-MM-DD
 */
export async function fetchCityWeather(loc, dateStr) {
  const key = `${loc.lat},${loc.lon},${dateStr}`
  if (weatherCache.has(key)) return weatherCache.get(key)

  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode',
    timezone: loc.tz || 'UTC',
    start_date: dateStr,
    end_date: dateStr,
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params}`
  let max = 20
  let min = 12
  let precip = 0
  let code = 3
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) })
    if (res.ok) {
      const data = await res.json()
      max = data.daily?.temperature_2m_max?.[0] ?? max
      min = data.daily?.temperature_2m_min?.[0] ?? min
      precip = data.daily?.precipitation_sum?.[0] ?? 0
      code = data.daily?.weathercode?.[0] ?? code
    }
  } catch {
    /* 오프라인·타임아웃 시 기본값 */
  }
  const classified = classifyWeather({ max, min, precip, code })
  const result = {
    city: loc.city,
    date: dateStr,
    maxC: Math.round(max * 10) / 10,
    minC: Math.round(min * 10) / 10,
    precipMm: precip,
    weatherCode: code,
    ...classified,
  }
  weatherCache.set(key, result)
  return result
}

/**
 * 날씨 적합 코디 + 일차 로테이션(전날 다름, 10일 후 재착용)
 * @param {'sua'|'ethan'} character
 * @param {import('./sns-ootd-catalog.mjs').DayOutfit} _base
 * @param {Awaited<ReturnType<typeof fetchCityWeather>>} weather
 * @param {number} [day1Based=1]
 */
export function applyWeatherToOutfit(character, _base, weather, day1Based = 1) {
  const idx = pickDailyOutfitIndex(character, day1Based, weather)
  let outfit = getOutfitByIndex(character, idx)
  outfit.outfitIndex = idx

  if (character === 'sua' && (weather.band === 'warm' || weather.band === 'hot' || weather.band === 'mild')) {
    outfit = cloneOutfit(outfit)
    const heelIdx = outfit.pieces.findIndex((p) => /heel|pump|sandal/i.test(p.item))
    if (heelIdx >= 0) {
      outfit.pieces[heelIdx] = { item: 'comfortable white sneakers', colors: 'clean white' }
    }
  }

  if (weather.carryUmbrella) {
    outfit = cloneOutfit(outfit)
    const hasUmbrella = outfit.accessories.some((a) => /umbrella/i.test(a.item))
    if (!hasUmbrella) {
      outfit.accessories.push({
        item: 'compact folded travel umbrella',
        colors: 'navy blue',
      })
    }
  } else {
    outfit = cloneOutfit(outfit)
    outfit.accessories = outfit.accessories.filter((a) => !/umbrella/i.test(a.item))
  }

  attachDetailLockToOutfit(outfit)
  outfit.promptLock = formatOutfitPromptLock(outfit)
  outfit.weather = weather
  outfit.weatherContextEn =
    `real ${weather.label} weather in ${weather.city}, daytime high about ${weather.maxC}°C low about ${weather.minC}°C, clothing must look appropriate for this temperature not wrong season`
  return outfit
}

/** @param {'sua'|'ethan'} character @param {Awaited<ReturnType<typeof fetchCityWeather>>} weather */
export function formatWeatherTxt(character, weather) {
  const ko = character === 'sua'
  const bandKo = { hot: '더움', warm: '따뜻', mild: '선선·레이어드', cool: '쌀쌀', cold: '추움' }
  const bandEn = { hot: 'hot', warm: 'warm', mild: 'mild layered', cool: 'cool', cold: 'cold' }
  const rain = weather.rainy ? (ko ? ', 비/이슬비 가능' : ', rain possible') : ''
  const umbrella = weather.carryUmbrella
    ? ko
      ? ' · 우산 소지'
      : ' · carry compact umbrella'
    : ko
      ? ' · 우산 없음'
      : ' · no umbrella'
  if (ko) {
    return (
      `[날씨 · ${weather.city} ${weather.date}]\n` +
      `${weather.label} · 최고 ${weather.maxC}°C / 최저 ${weather.minC}°C (${bandKo[weather.band]}${rain})${umbrella}\n` +
      `Open-Meteo 기준 — 아래 OOTD는 이 날씨에 맞게 자동 조정됨`
    )
  }
  return (
    `[Weather · ${weather.city} ${weather.date}]\n` +
    `${weather.label} · high ${weather.maxC}°C / low ${weather.minC}°C (${bandEn[weather.band]}${rain})${umbrella}\n` +
    `Source: Open-Meteo — OOTD below adjusted for this forecast`
  )
}
