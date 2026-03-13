/**
 * 클라이언트 사이드 이미지 최적화 유틸리티
 * Canvas API를 이용해 업로드 전 리사이즈 + 압축
 * - 아바타: 400×400px, WebP 0.82
 * - 프로필 사진: 1200×900px (최대), WebP 0.85
 * - 인증 사진: 1024×1024px (최대), WebP 0.80
 */

export type ImagePreset = 'avatar' | 'photo' | 'certification'

interface Preset {
  maxWidth: number
  maxHeight: number
  quality: number
}

const PRESETS: Record<ImagePreset, Preset> = {
  avatar: { maxWidth: 400, maxHeight: 400, quality: 0.82 },
  photo: { maxWidth: 1200, maxHeight: 900, quality: 0.85 },
  certification: { maxWidth: 1024, maxHeight: 1024, quality: 0.80 },
}

/**
 * 브라우저가 WebP 인코딩을 지원하는지 확인
 */
function supportsWebP(): boolean {
  try {
    const c = document.createElement('canvas')
    c.width = 1
    c.height = 1
    return c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

/**
 * File을 Canvas로 리사이즈·압축한 뒤 새 File 반환
 * @param file    원본 File 객체
 * @param preset  'avatar' | 'photo' | 'certification'
 * @returns       압축된 File (WebP 지원 시 .webp, 미지원 시 .jpg)
 */
export async function optimizeImage(
  file: File,
  preset: ImagePreset = 'photo'
): Promise<File> {
  const { maxWidth, maxHeight, quality } = PRESETS[preset]

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // 비율 유지하면서 최대 크기 이하로 축소
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }

      ctx.drawImage(img, 0, 0, width, height)

      const useWebP = supportsWebP()
      const mimeType = useWebP ? 'image/webp' : 'image/jpeg'
      const ext = useWebP ? 'webp' : 'jpg'

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Image conversion failed')); return }
          // 압축 후 오히려 더 크면 원본 반환
          if (blob.size >= file.size) {
            resolve(file)
            return
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          const newFile = new File([blob], `${baseName}.${ext}`, { type: mimeType })
          resolve(newFile)
        },
        mimeType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }

    img.src = objectUrl
  })
}

/**
 * 파일 크기를 사람이 읽기 좋은 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
