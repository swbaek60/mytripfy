/**
 * Beachhead city pages for programmatic SEO + density UX
 * id used in /destinations/[city]
 */
export interface BeachheadCity {
  id: string
  label: string
  labelEn: string
  countryCode: string
  cityNames: string[]
  targetActivePosts: number
  targetSponsors: number
  seoKeywords: string[]
}

export const BEACHHEAD_CITIES: BeachheadCity[] = [
  {
    id: 'seoul',
    label: '서울',
    labelEn: 'Seoul',
    countryCode: 'KR',
    cityNames: ['seoul', '서울'],
    targetActivePosts: 20,
    targetSponsors: 10,
    seoKeywords: ['travel companion Seoul', 'find travel buddy Seoul', 'solo travel Seoul'],
  },
  {
    id: 'tokyo',
    label: '도쿄',
    labelEn: 'Tokyo',
    countryCode: 'JP',
    cityNames: ['tokyo', '東京', '도쿄'],
    targetActivePosts: 20,
    targetSponsors: 10,
    seoKeywords: ['travel companion Tokyo', 'find travel buddy Tokyo', 'solo travel Tokyo'],
  },
  {
    id: 'bangkok',
    label: '방콕',
    labelEn: 'Bangkok',
    countryCode: 'TH',
    cityNames: ['bangkok', '방콕'],
    targetActivePosts: 20,
    targetSponsors: 10,
    seoKeywords: ['travel companion Bangkok', 'find travel buddy Bangkok', 'solo travel Bangkok'],
  },
  {
    id: 'osaka',
    label: '오사카',
    labelEn: 'Osaka',
    countryCode: 'JP',
    cityNames: ['osaka', '大阪', '오사카'],
    targetActivePosts: 20,
    targetSponsors: 10,
    seoKeywords: ['travel companion Osaka', 'find travel buddy Osaka', 'solo travel Osaka'],
  },
  {
    id: 'danang',
    label: '다낭',
    labelEn: 'Da Nang',
    countryCode: 'VN',
    cityNames: ['da nang', 'danang', 'đà nẵng', '다낭'],
    targetActivePosts: 20,
    targetSponsors: 10,
    seoKeywords: ['travel companion Da Nang', 'find travel buddy Da Nang', 'solo travel Vietnam'],
  },
]

export function getBeachheadById(id: string): BeachheadCity | undefined {
  return BEACHHEAD_CITIES.find((c) => c.id === id)
}

export function matchesBeachheadCity(
  city: BeachheadCity,
  countryCode: string | null | undefined,
  destinationCity: string | null | undefined
): boolean {
  if (!countryCode || countryCode.toUpperCase() !== city.countryCode) return false
  if (!destinationCity) return false
  const normalized = destinationCity.toLowerCase().trim()
  return city.cityNames.some((n) => normalized.includes(n.toLowerCase()))
}

export interface BeachheadCityStats {
  id: string
  label: string
  countryCode: string
  activePosts: number
  sponsors: number
  targetActivePosts: number
  targetSponsors: number
}
