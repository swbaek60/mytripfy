import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'
import { isOwnedPath, storagePathFromPublicUrl } from '@/lib/api/storage'

const MAX_PHOTOS = 5
const PHOTO_BUCKET = 'photos'

const bodySchema = z.object({
  photos: z.array(z.string().url().max(600)).max(MAX_PHOTOS),
})

/**
 * 프로필 사진 목록을 저장한다.
 *
 * 목록의 모든 URL 은 본인이 업로드한 photos 버킷 파일이어야 한다.
 * 목록에서 빠진 사진은 스토리지에서도 함께 정리한다.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'profile:photos', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { photos } = parsed.data

    const paths = photos.map((url) => storagePathFromPublicUrl(PHOTO_BUCKET, url))
    if (paths.some((path) => !path || !isOwnedPath(path, auth.user.profileId))) {
      return apiError('bad_request', 'Photos must be uploaded through the site first.')
    }

    const db = adminDb()

    const { data: current } = await db
      .from('profiles')
      .select('profile_photos')
      .eq('id', auth.user.profileId)
      .maybeSingle()

    const { error } = await db
      .from('profiles')
      .update({ profile_photos: photos, updated_at: new Date().toISOString() })
      .eq('id', auth.user.profileId)

    if (error) return apiDbFailure('profile/photos', error)

    const removed = ((current?.profile_photos as string[] | null) ?? [])
      .filter((url) => !photos.includes(url))
      .map((url) => storagePathFromPublicUrl(PHOTO_BUCKET, url))
      .filter((path): path is string => Boolean(path) && isOwnedPath(path!, auth.user.profileId))

    if (removed.length) {
      const { error: removeError } = await db.storage.from(PHOTO_BUCKET).remove(removed)
      // 스토리지 정리 실패는 사용자 흐름을 막지 않는다 (고아 파일만 남는다).
      if (removeError) console.error('[api/profile/photos] cleanup failed:', removeError.message)
    }

    return apiOk({ photos })
  } catch (err) {
    return apiFailure('profile/photos', err)
  }
}
