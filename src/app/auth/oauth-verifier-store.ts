/**
 * OAuth PKCE code_verifier를 flow_id로 잠시 보관합니다.
 * 콜백이 쿠키 없는 컨텍스트(예: 모바일 외부 브라우저)에서 열려도 exchange 가능하게 합니다.
 */
const TTL_MS = 5 * 60 * 1000 // 5분
const store = new Map<string, { verifier: string; expires: number }>()

function prune() {
  const now = Date.now()
  for (const [k, v] of store.entries()) {
    if (v.expires < now) store.delete(k)
  }
}

export function setVerifier(flowId: string, codeVerifier: string): void {
  prune()
  store.set(flowId, { verifier: codeVerifier, expires: Date.now() + TTL_MS })
}

export function getAndDeleteVerifier(flowId: string): string | null {
  const entry = store.get(flowId)
  store.delete(flowId)
  if (!entry || entry.expires < Date.now()) return null
  return entry.verifier
}
