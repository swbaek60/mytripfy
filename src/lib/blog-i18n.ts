import type { BlogSlug } from '@/data/blog-articles'

/** Blog 네임스페이스 중첩 키 — slug.title 형태 */
export function blogKey(slug: BlogSlug, field: string) {
  return `${slug}.${field}` as const
}
