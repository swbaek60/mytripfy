'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { optimizeImage, formatFileSize } from '@/utils/imageOptimizer'
import { api, errorMessage, uploadImage } from '@/lib/client/api'

interface Props {
  currentUrl: string | null
  onUpload: (url: string) => void
}

export default function AvatarUpload({ currentUrl, onUpload }: Props) {
  const tc = useTranslations('Common')
  const ts = useTranslations('Sponsors')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [sizeInfo, setSizeInfo] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setSizeInfo('')
    setError('')

    // 업로드가 끝나기 전까지는 로컬 미리보기만 보여준다.
    const previewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    try {
      const optimized = await optimizeImage(file, 'avatar')
      setSizeInfo(`${formatFileSize(file.size)} → ${formatFileSize(optimized.size)}`)

      const { url } = await uploadImage('avatars', optimized, { stable: true })
      await api.put('/api/profile/avatar', { avatarUrl: url })

      setPreview(previewUrl)
      onUpload(url)
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'))
      setSizeInfo('')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-brand-muted flex items-center justify-center text-4xl cursor-pointer overflow-hidden hover:opacity-80 transition-opacity relative"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- 업로드 전 미리보기는 blob: URL 이라 최적화할 수 없다.
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : <span>👤</span>}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-brand hover:underline font-medium disabled:opacity-50"
      >
        {uploading ? `⏳ ${tc('optimizingUploading')}` : `📷 ${ts('changePhoto')}`}
      </button>
      {sizeInfo && (
        <p className="text-xs text-success font-medium">✅ {tc('compressed', { info: sizeInfo })}</p>
      )}
      {error && (
        <p className="text-xs text-danger font-medium text-center max-w-[200px]">❌ {error}</p>
      )}
      <p className="text-xs text-hint">{tc('imageFormatAutoWebp')}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        aria-label={tc('selectPhoto')}
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
