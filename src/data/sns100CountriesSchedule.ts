/**
 * SNS 캠페인 "100 Countries in 1 Year" 일정용 국가 코드 순서.
 * 1년(365일) 동안 약 3.65일씩 한 국가 방문.
 * getCountryByCode()로 이름·이모지 조회 가능.
 */
export const SNS_100_COUNTRIES: string[] = [
  'KR', 'JP', 'CN', 'HK', 'TW', 'VN', 'TH', 'SG', 'MY', 'ID',  // 1-10 Asia
  'PH', 'KH', 'LA', 'MM', 'NP', 'IN', 'LK', 'AE', 'QA', 'OM',  // 11-20
  'JO', 'IL', 'TR', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'KG', 'TJ',  // 21-30
  'RU', 'MN', 'GB', 'IE', 'FR', 'BE', 'NL', 'DE', 'CH', 'AT',  // 31-40 Europe
  'IT', 'ES', 'PT', 'GR', 'HR', 'SI', 'HU', 'CZ', 'PL', 'SK',  // 41-50
  'RO', 'BG', 'RS', 'ME', 'AL', 'MK', 'LT', 'LV', 'EE', 'FI',  // 51-60
  'SE', 'NO', 'IS', 'DK', 'LU', 'MC', 'MT', 'CY', 'EG', 'MA',  // 61-70
  'TN', 'DZ', 'KE', 'TZ', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'UG',  // 71-80 Africa
  'RW', 'ET', 'GH', 'SN', 'CV', 'NG', 'CM', 'GA', 'MU', 'SC',  // 81-90
  'US', 'CA', 'MX', 'GT', 'CR', 'PA', 'CO', 'EC', 'PE', 'BR',  // 91-100 Americas
]

export const SNS_CAMPAIGN_DAYS_PER_COUNTRY = 365 / SNS_100_COUNTRIES.length

/** 수아 출발 국가 인덱스 (한국 KR) */
export const SUA_START_INDEX = 0
/** 이든 출발 국가 인덱스 (미국 US) – 각각 다른 나라에서 출발 */
export const ETHAN_START_INDEX = 90

function getIndexForDay(dayIndex1Based: number, startIndex: number): number {
  const raw = startIndex + Math.floor((dayIndex1Based - 1) / SNS_CAMPAIGN_DAYS_PER_COUNTRY)
  return ((raw % SNS_100_COUNTRIES.length) + SNS_100_COUNTRIES.length) % SNS_100_COUNTRIES.length
}

/** 캠페인 N일차 수아가 있는 국가 코드 (수아: 한국 출발) */
export function getSuaCountryCodeForDay(dayIndex1Based: number): string {
  return SNS_100_COUNTRIES[getIndexForDay(dayIndex1Based, SUA_START_INDEX)]
}

/** 캠페인 N일차 이든이 있는 국가 코드 (이든: 미국 출발) */
export function getEthanCountryCodeForDay(dayIndex1Based: number): string {
  return SNS_100_COUNTRIES[getIndexForDay(dayIndex1Based, ETHAN_START_INDEX)]
}

/** 캠페인 시작일로부터 N일차에 방문하는 국가 코드 (수아 기준, 1-based day) */
export function getCountryCodeForDay(dayIndex1Based: number): string {
  return getSuaCountryCodeForDay(dayIndex1Based)
}

/** 1년 중 수아 기준 몇 번째 국가인지 (1~100) */
export function getCountryNumberForDay(dayIndex1Based: number): number {
  return getIndexForDay(dayIndex1Based, SUA_START_INDEX) + 1
}
