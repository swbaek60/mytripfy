'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { optimizeImage, formatFileSize } from '@/utils/imageOptimizer'

interface Props {
  userId: string
  initialPhotos: string[]
  onUpdate: (photos: string[]) => void
}

const MAX_PHOTOS = 5

export default function ProfilePhotos({ userId, initialPhotos, onUpdate }: Props) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [uploadInfo, setUploadInfo] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) {
      alert(`Maximum ${MAX_PHOTOS} photos allowed. Please remove one first.`)
      return
    }

    const toUpload = files.slice(0, remaining)
    setUploading(true)
    setUploadInfo('')

    const supabase = createClient()
    const newUrls: string[] = []
    let totalOriginal = 0
    let totalCompressed = 0

    for (const file of toUpload) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name} is too large (max 20MB)`)
        continue
      }

      try {
        totalOriginal += file.size
        const optimized = await optimizeImage(file, 'photo')
        totalCompressed += optimized.size

        const ext = optimized.name.split('.').pop()
        const path = `${userId}/photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error } = await supabase.storage
          .from('photos')
          .upload(path, optimized, { contentType: optimized.type })

        if (error) throw error

        const { data } = supabase.storage.from('photos').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      } catch (err: any) {
        console.error('Upload error:', err)
      }
    }

    if (newUrls.length > 0) {
      const updated = [...photos, ...newUrls]
      setPhotos(updated)
      setUploadInfo(
        `${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} added · ` +
        `${formatFileSize(totalOriginal)} → ${formatFileSize(totalCompressed)}`
      )
      // DB 저장
      await supabase
        .from('profiles')
        .update({ profile_photos: updated })
        .eq('id', userId)
      onUpdate(updated)
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = async (url: string) => {
    if (!confirm('Remove this photo?')) return
    const updated = photos.filter(p => p !== url)
    setPhotos(updated)

    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ profile_photos: updated })
      .eq('id', userId)

    // Storage에서도 삭제 (경로 추출)
    try {
      const pathMatch = url.match(/photos\/(.+)$/)
      if (pathMatch) {
        await supabase.storage.from('photos').remove([pathMatch[1]])
      }
    } catch {
      // 스토리지 삭제 실패해도 DB는 이미 업데이트됨
    }

    onUpdate(updated)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-heading text-sm">
            📸 Profile Photos
            <span className="ml-2 text-xs font-normal text-hint">
              ({photos.length}/{MAX_PHOTOS})
            </span>
          </h3>
          <p className="text-xs text-hint mt-0.5">
            Show travelers what you look like on the road
          </p>
        </div>
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs bg-brand-light hover:bg-brand-muted text-brand font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? '⏳ Uploading...' : '+ Add Photos'}
          </button>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-surface-sunken">
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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
              className="aspect-square rounded-xl border-2 border-dashed border-edge hover:border-edge-brand hover:bg-brand-light flex items-center justify-center text-hint hover:text-blue-400 text-2xl transition-all disabled:opacity-50"
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
          <div className="text-sm font-medium text-subtle">Upload up to 5 photos</div>
          <div className="text-xs text-hint mt-1">Auto-compressed · Storage optimized</div>
        </button>
      )}

      {uploadInfo && (
        <p className="text-xs text-success font-medium bg-success-light px-3 py-1.5 rounded-lg">
          ✅ {uploadInfo}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
