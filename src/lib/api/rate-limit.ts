import type { NextRequest } from 'next/server'

/**
 * 인스턴스 로컬 고정 윈도우 rate limiter.
 *
 * 서버리스에서는 인스턴스마다 카운터가 분리되므로 전역 정확도는 보장되지 않는다.
 * 목적은 정밀한 쿼터가 아니라 단일 클라이언트의 폭주(스팸 발송, 유료 API 소진)를
 * 저비용으로 막는 것이다. 더 엄격한 보장이 필요하면 Upstash 같은 외부 저장소로 교체한다.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_TRACKED_KEYS = 10_000

/**
 * 만료된 버킷을 지운다. 그래도 상한을 넘으면 전부 비운다.
 *
 * 만료분만 지우면, 서로 다른 키가 상한보다 많이 동시에 살아 있는 상황에서 맵이 계속
 * 자란다. 오래 살아 있는 인스턴스에서 이건 느린 메모리 누수다. 전부 비우면 그 순간의
 * 카운터를 잃지만, 애초에 정밀한 쿼터가 아니라 폭주 차단용이므로 메모리 상한을
 * 지키는 쪽이 낫다.
 */
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  if (buckets.size > MAX_TRACKED_KEYS) buckets.clear()
}

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * @param key      제한 단위 (예: `email:${profileId}`)
 * @param limit    윈도우당 허용 횟수
 * @param windowMs 윈도우 길이 (밀리초)
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()

  if (buckets.size > MAX_TRACKED_KEYS) sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

/** 흔히 쓰는 프리셋 (윈도우, 허용 횟수) */
export const RATE_LIMITS = {
  /** 이메일 발송처럼 비용·평판 리스크가 큰 작업 */
  email: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** 유료 외부 API 호출 (번역 등) */
  paidApi: { limit: 60, windowMs: 60 * 1000 },
  /** 일반 쓰기 작업 */
  write: { limit: 120, windowMs: 60 * 1000 },
  /** 편집 중 자동 저장 (디바운스되지만 필드가 많아 호출이 잦다) */
  autosave: { limit: 300, windowMs: 60 * 1000 },
  /** 파일 업로드 */
  upload: { limit: 30, windowMs: 60 * 1000 },
} as const
