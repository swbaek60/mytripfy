/** Vercel CDN / 브라우저 캐시 헤더 (Fast Origin Transfer 절감) */
export const CACHE_PUBLIC_DAY =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'

export const CACHE_PUBLIC_HOUR =
  'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'

export const CACHE_PRIVATE_SHORT = 'private, max-age=120'

export const CACHE_NO_STORE = 'private, no-store'
