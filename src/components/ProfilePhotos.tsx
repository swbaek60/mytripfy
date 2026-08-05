'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { optimizeImage, formatFileSize } from '@/utils/imageOptimizer'
import { api, errorMessage, uploadImage } from '@/lib/client/api'
import SmartImage from '@/components/ui/SmartImage'

interface Props {
  initialPhotos: string[]
  onUpdate: (photos: string[]) => void
}

const MAX_PHOTOS = 5

export default function ProfilePhotos({ initialPhotos, onUpdate }: Props) {
  const tc = useTranslations('Common')
  const tp = useTranslations('ProfileEdit')
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [uploadInfo, setUploadInfo] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) {
      setError(tp('photosMaxReached', { count: MAX_PHOTOS }))
      return
    }

    const toUpload = files.slice(0, remaining)
    setUploading(true)
    setUploadInfo('')
    setError('')

    const newUrls: string[] = []
    let totalOriginal = 0
    let totalCompressed = 0
    let failed = 0

    for (const file of toUpload) {
      try {
        totalOriginal += file.size
        const optimized = await optimizeImage(file, 'photo')
        totalCompressed += optimized.size
        const { url } = await uploadImage('photos', optimized)
        newUrls.push(url)
      } catch (err) {
        failed += 1
        setError(errorMessage(err, tp('somePhotosFailed')))
      }
    }

    if (newUrls.length > 0) {
      const updated = [...photos, ...newUrls]
      try {
        await api.put('/api/profile/photos', { photos: updated })
        setPhotos(updated)
        onUpdate(updated)
        setUploadInfo(
          `${tp('photosAdded', { count: newUrls.length })} · ` +
          `${formatFileSize(totalOriginal)} → ${formatFileSize(totalCompressed)}`
        )
      } catch (err) {
        setError(errorMessage(err))
      }
    } else if (!failed) {
      setError(tp('noPhotosUploaded'))
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = async (url: string) => {
    if (!confirm(tp('removePhotoConfirm'))) return
    const updated = photos.filter(p => p !== url)
    try {
      await api.put('/api/profile/photos', { photos: updated })
      setPhotos(updated)
      onUpdate(updated)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-heading text-sm">
            📸 {tp('profilePhotos')}
            <span className="ml-2 text-xs font-normal text-hint">
              ({photos.length}/{MAX_PHOTOS})
            </span>
          </h3>
          <p className="text-xs text-hint mt-0.5">{tp('profilePhotosHint')}</p>
        </div>
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs bg-brand-light hover:bg-brand-muted text-brand-strong font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? `⏳ ${tp('uploading')}` : `+ ${tp('addPhotos')}`}
          </button>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-sunken">
              <SmartImage
                src={url}
                alt={`${tc('photo')} ${i + 1}`}
                width={320}
                height={320}
                sizes="(max-width: 640px) 33vw, 20vw"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                aria-label={tc('remove')}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-danger text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                ✕
              </button>
            </div>
          ))}

          {/* 빈 슬롯 */}
          {Array.from({ length: MAX_PHOTOS - photos.length }).map((_, i) => (
            <button
              key={`empty-${i}`}
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              aria-label={tp('addPhotos')}
              className="aspect-square rounded-xl border-2 border-dashed border-edge hover:border-edge-brand hover:bg-brand-light flex items-center justify-center text-hint hover:text-brand text-2xl transition-all disabled:opacity-50"
            >
              +
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-edge hover:border-edge-brand hover:bg-brand-light rounded-xl py-8 text-center transition-all disabled:opacity-50 mb-3"
        >
          <div className="text-3xl mb-1">📸</div>
          <div className="text-sm font-medium text-subtle">{tc('uploadUpToPhotos', { count: MAX_PHOTOS })}</div>
          <div className="text-xs text-hint mt-1">{tp('autoCompressed')}</div>
        </button>
      )}

      {uploadInfo && (
        <p className="text-xs text-success-strong font-medium bg-success-light px-3 py-1.5 rounded-lg">
          ✅ {uploadInfo}
        </p>
      )}

      {error && (
        <p className="text-xs text-danger-strong font-medium bg-danger-light px-3 py-1.5 rounded-lg mt-2">
          {error}
        </p>
      )}

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
