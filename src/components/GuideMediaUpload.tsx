'use client'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { optimizeImage } from '@/utils/imageOptimizer'
import { deleteImages, errorMessage, uploadImage } from '@/lib/client/api'
import SmartImage from '@/components/ui/SmartImage'

interface Props {
  folder: string
  initialPhotos: string[]
  label: string
  onUpdate: (photos: string[]) => void
  maxPhotos?: number
}

const BUCKET = 'guide-media'

export default function GuideMediaUpload({
  folder, initialPhotos, label, onUpdate, maxPhotos = 4
}: Props) {
  const tc = useTranslations('Common')
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = maxPhotos - photos.length
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length) return

    setUploading(true)
    setError('')
    const newUrls: string[] = []

    for (const file of toUpload) {
      try {
        const optimized = await optimizeImage(file, 'photo')
        const { url } = await uploadImage(BUCKET, optimized)
        newUrls.push(url)
      } catch (err) {
        setError(errorMessage(err, 'Some photos could not be uploaded.'))
      }
    }

    if (newUrls.length > 0) {
      const updated = [...photos, ...newUrls]
      setPhotos(updated)
      onUpdate(updated)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = async (url: string) => {
    const updated = photos.filter(p => p !== url)
    setPhotos(updated)
    onUpdate(updated)
    // 프로필 저장 전 미리 지워도 무방하다 (저장 시 목록에서 이미 빠져 있다).
    deleteImages(BUCKET, [url]).catch(() => {})
  }

  return (
    <div>
      <p className="text-xs text-subtle mb-2 font-medium">{label} {tc('photosMax', { count: maxPhotos })}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface-sunken group shrink-0">
            <SmartImage src={url} alt={`${folder} ${i + 1}`} width={160} height={160} sizes="80px" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              aria-label={tc('remove')}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-danger text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >✕</button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-edge hover:border-edge-brand hover:bg-brand-light flex flex-col items-center justify-center text-hint hover:text-brand transition-all disabled:opacity-50 shrink-0"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-xl leading-none">+</span>
                <span className="text-xs mt-0.5">{tc('photo')}</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        aria-label={tc('selectPhoto')}
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
