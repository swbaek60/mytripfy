/**
 * 인증된 업로드가 허용된 스토리지 버킷 정의.
 *
 * 모든 업로드 경로는 `${profileId}/...` 로 강제되므로, 사용자는 자기 폴더 밖에
 * 파일을 쓰거나 남의 파일을 지울 수 없다.
 */
export const UPLOAD_BUCKETS = {
  avatars: { maxBytes: 3 * 1024 * 1024, prefix: 'avatar' },
  photos: { maxBytes: 5 * 1024 * 1024, prefix: 'photo' },
  certifications: { maxBytes: 5 * 1024 * 1024, prefix: 'cert' },
  'guide-media': { maxBytes: 8 * 1024 * 1024, prefix: 'guide' },
} as const

export type UploadBucket = keyof typeof UPLOAD_BUCKETS

export const UPLOAD_BUCKET_NAMES = Object.keys(UPLOAD_BUCKETS) as [UploadBucket, ...UploadBucket[]]

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
] as const

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif',
}

export function isAllowedImageType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)
}

export function extensionForType(type: string): string {
  return EXTENSION_BY_TYPE[type] ?? 'bin'
}

/**
 * 사용자 폴더 안의 안전한 저장 경로를 만든다.
 * `stable` 이 true 면 덮어쓰기용 고정 이름(아바타)을, 아니면 충돌 없는 유일 이름을 쓴다.
 */
export function buildStoragePath(
  bucket: UploadBucket,
  profileId: string,
  contentType: string,
  options?: { stable?: boolean }
): string {
  const ext = extensionForType(contentType)
  const { prefix } = UPLOAD_BUCKETS[bucket]
  if (options?.stable) return `${profileId}/${prefix}.${ext}`
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${profileId}/${prefix}-${unique}.${ext}`
}

/**
 * 공개 URL 에서 스토리지 내부 경로를 추출한다.
 * 해당 버킷의 URL 이 아니면 null 을 반환한다.
 */
export function storagePathFromPublicUrl(bucket: string, url: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  const path = url.slice(index + marker.length).split('?')[0]
  return path ? decodeURIComponent(path) : null
}

/** 경로가 해당 사용자 폴더 안에 있는지 확인한다. */
export function isOwnedPath(path: string, profileId: string): boolean {
  return path.startsWith(`${profileId}/`) && !path.includes('..')
}
