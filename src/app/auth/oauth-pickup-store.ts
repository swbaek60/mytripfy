/**
 * OAuth 세션 픽업용 일회성 토큰 저장소.
 *
 * 모바일에서 새 탭으로 OAuth가 완료되면, 그 탭에만 세션 쿠키가 설정됩니다.
 * opener(로그인 탭)가 세션을 받으려면 픽업 URL로 이동해 쿠키를 받아야 합니다.
 * 이 저장소에 토큰 → 쿠키 목록을 잠시 보관합니다.
 *
 * 프로덕션 다중 인스턴스 환경에서는 Redis/KV 등으로 교체하는 것이 좋습니다.
 */
export interface StoredCookie {
  name: string
  value: string
  path?: string
  maxAge?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  domain?: string
}

export interface PickupEntry {
  cookies: StoredCookie[]
  locale: string
  expires: number
}

const TTL_MS = 60 * 1000 // 1분
const store = new Map<string, PickupEntry>()

function prune() {
  const now = Date.now()
  for (const [k, v] of store.entries()) {
    if (v.expires < now) store.delete(k)
  }
}

export function setPickupToken(token: string, cookies: StoredCookie[], locale: string): void {
  prune()
  store.set(token, { cookies, locale, expires: Date.now() + TTL_MS })
}

export function getAndDeletePickupToken(token: string): PickupEntry | null {
  const entry = store.get(token)
  store.delete(token)
  if (!entry || entry.expires < Date.now()) return null
  return entry
}
