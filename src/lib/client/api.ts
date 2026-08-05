'use client'

import type { UploadBucket } from '@/lib/api/storage'

/**
 * 브라우저에서 서버 API 를 호출하는 공통 클라이언트.
 *
 * 모든 쓰기 작업은 Supabase 클라이언트를 직접 쓰지 않고 이 헬퍼를 통해
 * 서버 Route Handler 로 보낸다. 서버가 소유권·검증·rate limit 을 담당한다.
 */

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function readError(res: Response): Promise<never> {
  let message = 'Something went wrong. Please try again.'
  let code: string | undefined
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') message = body.error
    if (typeof body?.code === 'string') code = body.code
  } catch {
    // 응답 본문이 JSON 이 아니면 기본 메시지를 쓴다.
  }
  throw new ApiError(message, res.status, code)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) await readError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body === undefined ? undefined : JSON.stringify(body) }),
}

export type UploadResult = { url: string; path: string; bucket: UploadBucket }

/**
 * 이미지를 서버 경유로 업로드한다.
 * `stable` 은 아바타처럼 같은 경로를 덮어써야 할 때만 사용한다.
 */
export async function uploadImage(
  bucket: UploadBucket,
  file: File,
  options?: { stable?: boolean }
): Promise<UploadResult> {
  const form = new FormData()
  form.append('bucket', bucket)
  form.append('file', file)
  if (options?.stable) form.append('stable', '1')
  return request<UploadResult>('/api/storage/upload', { method: 'POST', body: form })
}

/** 업로드한 이미지를 삭제한다. 본인이 올린 파일만 지워진다. */
export async function deleteImages(bucket: UploadBucket, urls: string[]): Promise<number> {
  if (!urls.length) return 0
  const { removed } = await request<{ removed: number }>('/api/storage/upload', {
    method: 'DELETE',
    body: JSON.stringify({ bucket, urls }),
  })
  return removed
}

/** 사용자에게 보여줄 안전한 에러 메시지를 뽑아낸다. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}
