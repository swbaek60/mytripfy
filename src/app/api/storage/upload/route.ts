import { NextRequest } from 'next/server'
import { adminDb, enforceRateLimit, requireUser } from '@/lib/api/guard'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { apiError, apiFailure, apiOk } from '@/lib/api/respond'
import {
  UPLOAD_BUCKETS,
  buildStoragePath,
  isAllowedImageType,
  isOwnedPath,
  storagePathFromPublicUrl,
  type UploadBucket,
} from '@/lib/api/storage'

export const runtime = 'nodejs'

function resolveBucket(value: string | null): UploadBucket | null {
  if (!value) return null
  return value in UPLOAD_BUCKETS ? (value as UploadBucket) : null
}

/**
 * 인증된 이미지 업로드.
 *
 * multipart/form-data: `bucket`, `file`, 선택적 `stable=1`(고정 파일명, 아바타용).
 * 저장 경로는 서버가 `${profileId}/...` 로 강제하므로 다른 사용자의 폴더에 쓸 수 없다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'storage:upload', auth.user.profileId, RATE_LIMITS.upload)
    if (limited) return limited.response

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return apiError('bad_request', 'Expected multipart/form-data.')
    }

    const bucket = resolveBucket(form.get('bucket') as string | null)
    if (!bucket) return apiError('bad_request', 'Unsupported upload target.')

    const file = form.get('file')
    if (!(file instanceof File)) return apiError('bad_request', 'No file provided.')

    if (!isAllowedImageType(file.type)) {
      return apiError('bad_request', 'Only JPEG, PNG, WebP, HEIC and AVIF images are allowed.')
    }

    const { maxBytes } = UPLOAD_BUCKETS[bucket]
    if (file.size > maxBytes) {
      return apiError('bad_request', `File is too large (max ${Math.round(maxBytes / 1024 / 1024)}MB).`)
    }

    const stable = form.get('stable') === '1'
    const path = buildStoragePath(bucket, auth.user.profileId, file.type, { stable })

    const db = adminDb()
    const { error } = await db.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: stable,
    })

    if (error) {
      console.error('[api/storage/upload] upload failed:', bucket, error.message)
      return apiError('internal', 'Upload failed. Please try again.')
    }

    const { data } = db.storage.from(bucket).getPublicUrl(path)
    // 고정 파일명은 CDN 캐시를 무효화하기 위해 버전 쿼리를 붙인다.
    const url = stable ? `${data.publicUrl}?v=${Date.now()}` : data.publicUrl

    return apiOk({ url, path, bucket })
  } catch (err) {
    return apiFailure('storage/upload', err)
  }
}

/**
 * 업로드한 파일을 삭제한다. 자기 폴더 안의 파일만 지울 수 있다.
 * body: `{ bucket, urls: string[] }`
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    let body: { bucket?: unknown; urls?: unknown }
    try {
      body = await req.json()
    } catch {
      return apiError('bad_request', 'Request body must be valid JSON.')
    }

    const bucket = resolveBucket(typeof body.bucket === 'string' ? body.bucket : null)
    if (!bucket) return apiError('bad_request', 'Unsupported upload target.')

    const urls = Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === 'string') : []
    if (!urls.length) return apiError('bad_request', 'No files specified.')

    const paths = urls
      .map((url) => storagePathFromPublicUrl(bucket, url))
      .filter((path): path is string => Boolean(path) && isOwnedPath(path!, auth.user.profileId))

    if (!paths.length) return apiOk({ removed: 0 })

    const { error } = await adminDb().storage.from(bucket).remove(paths)
    if (error) {
      console.error('[api/storage/upload] remove failed:', bucket, error.message)
      return apiError('internal', 'Could not remove the file. Please try again.')
    }

    return apiOk({ removed: paths.length })
  } catch (err) {
    return apiFailure('storage/upload', err)
  }
}
