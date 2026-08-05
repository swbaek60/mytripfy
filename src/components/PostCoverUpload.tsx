'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { errorMessage, uploadImage } from '@/lib/client/api'
import { optimizeImage } from '@/utils/imageOptimizer'

interface Props {
  currentUrl: string | null
  onUpload: (url: string | null) => void
}

export default function PostCoverUpload({ currentUrl, onUpload }: Props) {
  const tc = useTranslations('Common')
  const ts = useTranslations('Sponsors')
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const optimized = await optimizeImage(file, 'cover')
      const { url } = await uploadImage('photos', optimized)
      setPreview(url)
      onUpload(url)
    } catch (err) {
      setError(errorMessage(err, tc('uploadFailed')))
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
        className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-edge bg-surface-sunken hover:border-edge-brand hover:bg-brand-light transition-colors cursor-pointer"
        style={{ aspectRatio: '16/7' }}
        onClick={() => !preview && inputRef.current?.click()}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- 업로드 전 미리보기는 blob: URL 이라 최적화할 수 없다. */}
            <img src={preview} alt={ts('coverAlt')} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                className="bg-white text-body text-sm font-medium px-4 py-2 rounded-full shadow hover:bg-surface-hover transition"
              >
                {ts('changePhoto')}
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRemove() }}
                className="bg-white text-danger text-sm font-medium px-4 py-2 rounded-full shadow hover:bg-danger-light transition flex items-center gap-1"
              >
                <X size={13} /> {tc('remove')}
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-hint">
            {uploading ? (
              <Loader2 size={28} className="animate-spin text-brand" />
            ) : (
              <>
                <ImagePlus size={28} />
                <p className="text-sm font-medium">{tc('addCoverPhoto')}</p>
                <p className="text-xs">{tc('imageFormatMax', { mb: 10 })}</p>
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

      {error && <p className="text-xs text-danger">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={tc('selectPhoto')}
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
