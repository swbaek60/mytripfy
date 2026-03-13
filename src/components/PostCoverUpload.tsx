'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ImagePlus, X, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  currentUrl: string | null
  onUpload: (url: string | null) => void
}

export default function PostCoverUpload({ userId, currentUrl, onUpload }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB'); return }

    setUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${userId}/post-cover-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('photos').getPublicUrl(path)
      const url = data.publicUrl + `?t=${Date.now()}`
      setPreview(url)
      onUpload(url)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUpload(null)
  }

  return (
    <div className="space-y-2">
      <div
        className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
        style={{ aspectRatio: '16/7' }}
        onClick={() => !preview && inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                className="bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-full shadow hover:bg-gray-50 transition"
              >
                Change
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRemove() }}
                className="bg-white text-red-500 text-sm font-medium px-4 py-2 rounded-full shadow hover:bg-red-50 transition flex items-center gap-1"
              >
                <X size={13} /> Remove
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            {uploading ? (
              <Loader2 size={28} className="animate-spin text-blue-500" />
            ) : (
              <>
                <ImagePlus size={28} />
                <p className="text-sm font-medium">Add cover photo</p>
                <p className="text-xs">JPG, PNG, WebP · Max 10MB</p>
              </>
            )}
          </div>
        )}

        {uploading && preview && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
