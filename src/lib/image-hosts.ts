/**
 * next/image 가 최적화할 수 있는 원격 호스트 목록.
 *
 * `next.config.ts` 의 `images.remotePatterns` 와 이 파일이 갈라지면 런타임에
 * "hostname is not configured" 오류가 난다. 그래서 한 곳에서만 정의하고
 * 설정과 컴포넌트가 같은 값을 읽는다.
 */
export const IMAGE_HOSTNAMES = [
  // Clerk 사용자 프로필 이미지 (Google, Facebook OAuth 등)
  'img.clerk.com',
  '*.clerk.accounts.dev',
  'images.clerk.dev',
  'lh3.googleusercontent.com',
  '*.fbcdn.net',
  'images.unsplash.com',
  // Supabase Storage (아바타·인증샷·가이드 미디어)
  '*.supabase.co',
] as const

export const IMAGE_REMOTE_PATTERNS = IMAGE_HOSTNAMES.map((hostname) => ({
  protocol: 'https' as const,
  hostname,
}))

function hostMatches(host: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1) // ".supabase.co"
    return host.endsWith(suffix) && host.length > suffix.length
  }
  return host === pattern
}

/**
 * 이 URL 을 next/image 로 넘겨도 안전한지 확인한다.
 * 허용 목록에 없는 호스트는 최적화 없이 렌더해야 이미지가 깨지지 않는다.
 */
export function isOptimizableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (url.startsWith('/')) return true
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return IMAGE_HOSTNAMES.some((pattern) => hostMatches(parsed.hostname, pattern))
  } catch {
    return false
  }
}
