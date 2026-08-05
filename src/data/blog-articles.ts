/** 블로그 slug — messages Blog.{slug}* 키와 동기화 */
export const BLOG_SLUGS = [
  '100-countries-challenge',
  'find-travel-companion',
  'become-local-guide',
  'find-companion-bangkok',
  'find-companion-osaka',
  'find-companion-seoul',
  'find-companion-tokyo',
] as const

export type BlogSlug = (typeof BLOG_SLUGS)[number]

export function isBlogSlug(slug: string): slug is BlogSlug {
  return (BLOG_SLUGS as readonly string[]).includes(slug)
}

/** SEO·JSON-LD용 고정 발행일 */
export const BLOG_PUBLISHED_AT: Record<BlogSlug, string> = {
  '100-countries-challenge': '2026-06-01',
  'find-travel-companion': '2026-06-03',
  'become-local-guide': '2026-06-05',
  'find-companion-bangkok': '2026-07-31',
  'find-companion-osaka': '2026-07-31',
  'find-companion-seoul': '2026-07-31',
  'find-companion-tokyo': '2026-07-31',
}
