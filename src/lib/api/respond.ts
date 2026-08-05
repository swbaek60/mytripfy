import { NextResponse } from 'next/server'
import { CACHE_NO_STORE } from '@/lib/http-cache'

/**
 * Route Handler 공통 응답 헬퍼.
 *
 * 클라이언트에는 항상 사람이 읽을 수 있는 일반화된 메시지만 노출한다.
 * DB 드라이버 메시지·스택은 서버 로그에만 남긴다 (스키마·제약조건 유출 방지).
 */

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'unavailable'
  | 'internal'

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  unavailable: 503,
  internal: 500,
}

const DEFAULT_MESSAGE: Record<ApiErrorCode, string> = {
  bad_request: 'Invalid request.',
  unauthorized: 'Sign in required.',
  forbidden: 'You do not have permission to do that.',
  not_found: 'Not found.',
  conflict: 'Already exists.',
  rate_limited: 'Too many requests. Please try again shortly.',
  unavailable: 'This feature is temporarily unavailable.',
  internal: 'Something went wrong. Please try again.',
}

export function apiError(
  code: ApiErrorCode,
  message?: string,
  init?: { headers?: Record<string, string> }
) {
  return NextResponse.json(
    { error: message ?? DEFAULT_MESSAGE[code], code },
    {
      status: STATUS_BY_CODE[code],
      headers: { 'Cache-Control': CACHE_NO_STORE, ...init?.headers },
    }
  )
}

export function apiOk<T extends Record<string, unknown>>(
  body: T = {} as T,
  init?: { status?: number; cache?: string }
) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: { 'Cache-Control': init?.cache ?? CACHE_NO_STORE },
  })
}

/**
 * 예상하지 못한 예외를 서버 로그에 남기고 일반화된 500을 반환한다.
 * `scope` 는 로그 검색용 라우트 식별자.
 */
export function apiFailure(scope: string, err: unknown) {
  console.error(`[api/${scope}]`, err)
  return apiError('internal')
}

/**
 * Supabase 에러를 서버 로그에만 남기고 일반화된 응답을 반환한다.
 */
export function apiDbFailure(
  scope: string,
  err: { message?: string; code?: string } | null,
  fallback: ApiErrorCode = 'internal'
) {
  console.error(`[api/${scope}] db error:`, err?.code, err?.message)
  if (err?.code === '23505') return apiError('conflict')
  return apiError(fallback)
}
