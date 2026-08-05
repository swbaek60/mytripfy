/**
 * 내비게이션 활성 링크 판별.
 *
 * `pathname.includes(href)` 로 판별하면 두 가지가 어긋난다.
 *  - `/challenges/feed` 에서 `/challenges` 와 `/challenges/feed` 가 동시에 활성이 된다.
 *  - `/guides` 가 `/guides-archive` 같은 경로에도 걸린다.
 * 그래서 세그먼트 경계를 지키면서, 후보 중 가장 구체적인 하나만 활성으로 본다.
 */

/** 로케일 접두사(`/ko`, `/pt-BR`)를 떼어낸 경로를 반환한다. */
export function stripLocale(pathname: string, locale: string): string {
  const prefix = `/${locale}`
  if (pathname === prefix) return '/'
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname
}

function matches(path: string, href: string): boolean {
  const target = href.split('?')[0].replace(/\/$/, '')
  if (!target || target === '/') return path === '/'
  return path === target || path.startsWith(`${target}/`)
}

/**
 * 후보 href 중 현재 경로에 가장 잘 맞는 하나를 고른다. 없으면 null.
 * 예: `/challenges/feed` 에서 후보가 `/challenges`, `/challenges/feed` 면 후자를 고른다.
 */
export function activeHref(pathname: string, locale: string, hrefs: string[]): string | null {
  const path = stripLocale(pathname, locale)
  let best: string | null = null
  for (const href of hrefs) {
    if (!matches(path, href)) continue
    if (best === null || href.length > best.length) best = href
  }
  return best
}
