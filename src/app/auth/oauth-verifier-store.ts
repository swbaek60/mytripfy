/**
 * OAuth PKCE code_verifier를 flow_id로 잠시 보관합니다.
 * - 서버리스(멀티 인스턴스): Supabase DB 사용 (oauth_flow_verifier 테이블)
 * - 로컬/키 없음: 메모리 Map 폴백
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const TTL_MS = 5 * 60 * 1000 // 5분
const TABLE = 'oauth_flow_verifier'

const memoryStore = new Map<string, { verifier: string; expires: number }>()

function memoryPrune() {
  const now = Date.now()
  for (const [k, v] of memoryStore.entries()) {
    if (v.expires < now) memoryStore.delete(k)
  }
}

/** DB에 저장 (서버리스에서 인스턴스 간 공유) */
export async function setVerifierDb(
  flowId: string,
  codeVerifier: string,
  supabase: SupabaseClient
): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString()
  await supabase.from(TABLE).upsert(
    { flow_id: flowId, code_verifier: codeVerifier, expires_at: expiresAt },
    { onConflict: 'flow_id' }
  )
}

/** DB에서 조회 후 삭제 */
export async function getAndDeleteVerifierDb(
  flowId: string,
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code_verifier, expires_at')
    .eq('flow_id', flowId)
    .maybeSingle()

  if (error || !data) return null
  const expiresAt = new Date(data.expires_at).getTime()
  if (expiresAt < Date.now()) return null

  await supabase.from(TABLE).delete().eq('flow_id', flowId)
  return data.code_verifier
}

/** 메모리 저장 (로컬/SUPABASE_SERVICE_ROLE_KEY 없을 때) */
export function setVerifier(flowId: string, codeVerifier: string): void {
  memoryPrune()
  memoryStore.set(flowId, { verifier: codeVerifier, expires: Date.now() + TTL_MS })
}

/** 메모리에서 조회 후 삭제 */
export function getAndDeleteVerifier(flowId: string): string | null {
  const entry = memoryStore.get(flowId)
  memoryStore.delete(flowId)
  if (!entry || entry.expires < Date.now()) return null
  return entry.verifier
}
