/**
 * UTM helpers for consistent campaign tracking
 */
import { SITE_URL } from './paths.mjs'

/**
 * @param {string} path e.g. /companions or companions
 * @param {{ source: string, medium?: string, campaign?: string, content?: string }} utm
 */
export function withUtm(path, utm) {
  const p = path.startsWith('http')
    ? path
    : `${SITE_URL}/en${path.startsWith('/') ? path : `/${path}`}`
  const u = new URL(p)
  u.searchParams.set('utm_source', utm.source)
  u.searchParams.set('utm_medium', utm.medium || 'organic')
  if (utm.campaign) u.searchParams.set('utm_campaign', utm.campaign)
  if (utm.content) u.searchParams.set('utm_content', utm.content)
  return u.toString()
}

export const UTM_SOURCES = {
  instagram: 'instagram',
  blog: 'blog',
  reddit: 'reddit',
  producthunt: 'producthunt',
  directory: 'directory',
  youtube: 'youtube',
  outreach: 'outreach',
}
