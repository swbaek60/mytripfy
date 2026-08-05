/** Affiliate link builders for challenge-related activity bookings */

const KLOOK_AID = process.env.KLOOK_AFFILIATE_ID ?? 'mytripfy'
const VIATOR_PID = process.env.VIATOR_PARTNER_ID ?? 'mytripfy'

export interface AffiliateLink {
  provider: 'klook' | 'viator'
  labelKey: 'affiliateKlook' | 'affiliateViator'
  url: string
}

export function buildKlookUrl(query: string, countryCode?: string | null): string {
  const q = encodeURIComponent(query.trim())
  const cc = countryCode ? `&country=${encodeURIComponent(countryCode.toUpperCase())}` : ''
  return `https://www.klook.com/search/?query=${q}&aid=${encodeURIComponent(KLOOK_AID)}${cc}&utm_source=mytripfy&utm_medium=affiliate`
}

export function buildViatorUrl(query: string): string {
  const q = encodeURIComponent(query.trim())
  return `https://www.viator.com/searchResults/all?text=${q}&pid=${encodeURIComponent(VIATOR_PID)}&utm_source=mytripfy&utm_medium=affiliate`
}

/** Categories where activity booking affiliate makes sense */
const ACTIVITY_CATEGORIES = new Set([
  'attractions',
  'scuba',
  'surfing',
  'skiing',
  'fishing',
  'golf',
  'nature',
  'museums',
  'festivals',
  'islands',
])

export function getChallengeAffiliateLinks(
  title: string,
  category: string,
  countryCode?: string | null
): AffiliateLink[] {
  if (!ACTIVITY_CATEGORIES.has(category)) return []
  const query = title.replace(/,\s*/g, ' ').trim()
  if (!query) return []
  return [
    { provider: 'klook', labelKey: 'affiliateKlook', url: buildKlookUrl(query, countryCode) },
    { provider: 'viator', labelKey: 'affiliateViator', url: buildViatorUrl(query) },
  ]
}
