/** Referral helpers — cookie + profile codes */
export const REFERRAL_COOKIE = 'mt_ref'
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function normalizeReferralCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const c = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (c.length < 4 || c.length > 16) return null
  return c
}

export function buildInvitePath(locale: string, code: string): string {
  return `/${locale}/invite/${code}`
}

export function buildInviteUrl(locale: string, code: string, origin = 'https://www.mytripfy.com'): string {
  return `${origin}${buildInvitePath(locale, code)}?utm_source=referral&utm_medium=organic&utm_campaign=invite`
}
