import { apiError } from '@/lib/api/respond'
import { isOwnedPath, storagePathFromPublicUrl, type UploadBucket } from '@/lib/api/storage'

/**
 * 클라이언트가 보낸 이미지 URL 이 "본인이 업로드한 우리 스토리지 파일"인지 검증한다.
 *
 * 이 검증이 없으면 임의의 외부 URL(추적 픽셀·악성 이미지)이나 다른 사용자의
 * 파일 경로를 본문에 심을 수 있다. null/undefined 는 통과시킨다 (이미지 미첨부).
 */
export function assertOwnedImageUrl(
  bucket: UploadBucket,
  url: string | null | undefined,
  profileId: string
) {
  if (!url) return null
  const path = storagePathFromPublicUrl(bucket, url)
  if (!path || !isOwnedPath(path, profileId)) {
    return apiError('bad_request', 'Image must be uploaded through the site first.')
  }
  return null
}
