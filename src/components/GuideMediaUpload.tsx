'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { optimizeImage } from '@/utils/imageOptimizer'

interface Props {
  userId: string
  bucket: string
  folder: string
  initialPhotos: string[]
  label: string
  onUpdate: (photos: string[]) => void
  maxPhotos?: number
}

export default function GuideMediaUpload({
  userId, bucket, folder, initialPhotos, label, onUpdate, maxPhotos = 4
}: Props) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = maxPhotos - photos.length
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length) return

    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of toUpload) {
      try {
        const optimized = await optimizeImage(file, 'photo')
        const ext = optimized.name.split('.').pop()
        const fileName = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, optimized, { contentType: optimized.type })
        if (uploadError) continue
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
        newUrls.push(data.publicUrl)
      } catch {}
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

    const supabase = createClient()
    try {
      const path = url.split(`/storage/v1/object/public/${bucket}/`)[1]
      if (path) await supabase.storage.from(bucket).remove([path])
    } catch {}
  }

  return (
    <div>
      <p className="text-xs text-subtle mb-2 font-medium">{label} (최대 {maxPhotos}장)</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface-sunken group shrink-0">
            <img src={url} alt={`${folder} ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-500 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >✕</button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-edge hover:border-edge-brand hover:bg-brand-light flex flex-col items-center justify-center text-hint hover:text-blue-400 transition-all disabled:opacity-50 shrink-0"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-xl leading-none">+</span>
                <span className="text-xs mt-0.5">사진</span>
              </>
            )}
          </button>
        )}
      </div>
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
