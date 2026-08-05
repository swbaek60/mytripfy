import type { NextRequest } from 'next/server'
import type { z } from 'zod'
import { getAuthUser, createAdminClient } from '@/utils/supabase/server'
import { ADMIN_EMAIL } from '@/lib/admin/require-admin'
import { apiError } from '@/lib/api/respond'
import { RATE_LIMITS, clientIp, rateLimit } from '@/lib/api/rate-limit'

export interface AuthedUser {
  clerkUserId: string
  profileId: string
  email: string
}

/**
 * 인증된 사용자를 반환하거나 401 응답을 반환한다.
 *
 * 사용 패턴:
 * ```ts
 * const auth = await requireUser()
 * if ('response' in auth) return auth.response
 * // auth.user.profileId 사용
 * ```
 *
 * profileId 는 항상 서버가 Clerk 세션에서 도출한다. 클라이언트가 보낸 사용자 ID는
 * 절대 신뢰하지 않는다.
 */
export async function requireUser(): Promise<
  { user: AuthedUser } | { response: ReturnType<typeof apiError> }
> {
  const user = await getAuthUser()
  if (!user) return { response: apiError('unauthorized') }
  return { user }
}

/** 관리자 전용 라우트 가드. */
export async function requireAdminUser(): Promise<
  { user: AuthedUser } | { response: ReturnType<typeof apiError> }
> {
  const result = await requireUser()
  if ('response' in result) return result
  if (result.user.email !== ADMIN_EMAIL) return { response: apiError('forbidden') }
  return result
}

/**
 * Cron / 내부 자동화 전용 라우트 가드.
 * `CRON_SECRET` 이 설정돼 있지 않으면 요청을 거부한다 (기본 차단).
 */
export function requireCronSecret(req: NextRequest): { response: ReturnType<typeof apiError> } | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return { response: apiError('forbidden', 'CRON_SECRET is not configured.') }

  const header = req.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : req.headers.get('x-cron-secret')
  if (provided !== secret) return { response: apiError('unauthorized') }

  return null
}

/**
 * rate limit 을 적용한다. 초과 시 429 응답을 반환하고, 통과하면 null 을 반환한다.
 * 로그인 사용자는 profileId 로, 비로그인은 IP 로 버킷을 나눈다.
 */
export function enforceRateLimit(
  req: NextRequest,
  scope: string,
  identity: string | null,
  preset: { limit: number; windowMs: number } = RATE_LIMITS.write
): { response: ReturnType<typeof apiError> } | null {
  const key = `${scope}:${identity ?? clientIp(req)}`
  const result = rateLimit(key, preset.limit, preset.windowMs)
  if (result.ok) return null
  return {
    response: apiError('rate_limited', undefined, {
      headers: { 'Retry-After': String(result.retryAfterSeconds) },
    }),
  }
}

/**
 * 요청 본문을 zod 스키마로 검증한다.
 * 실패 시 400 응답을 반환한다 (필드 상세는 노출하되 DB 정보는 포함하지 않음).
 */
export async function parseJsonBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S
): Promise<{ data: z.infer<S> } | { response: ReturnType<typeof apiError> }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { response: apiError('bad_request', 'Request body must be valid JSON.') }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const field = first?.path.join('.')
    return {
      response: apiError(
        'bad_request',
        field ? `Invalid value for "${field}".` : 'Invalid request body.'
      ),
    }
  }

  return { data: parsed.data }
}

/** 쿼리 파라미터를 zod 스키마로 검증한다. */
export function parseSearchParams<S extends z.ZodType>(
  req: NextRequest,
  schema: S
): { data: z.infer<S> } | { response: ReturnType<typeof apiError> } {
  const raw = Object.fromEntries(new URL(req.url).searchParams.entries())
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.join('.')
    return {
      response: apiError(
        'bad_request',
        field ? `Invalid query parameter "${field}".` : 'Invalid query parameters.'
      ),
    }
  }
  return { data: parsed.data }
}

/**
 * 서비스 롤 클라이언트. 모든 라우트는 이 클라이언트를 쓰기 전에
 * `requireUser()` 로 신원을 확인하고, 대상 행의 소유권을 직접 검증해야 한다.
 */
export function adminDb() {
  return createAdminClient()
}
