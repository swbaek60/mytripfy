'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { optimizeImage, formatFileSize } from '@/utils/imageOptimizer'

interface Props {
  userId: string
  currentUrl: string | null
  onUpload: (url: string) => void
}

export default function AvatarUpload({ userId, currentUrl, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [sizeInfo, setSizeInfo] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File size must be under 10MB'); return }

    setUploading(true)
    setSizeInfo('')
    setError('')

    // 로컬 미리보기 (업로드 성공 전에는 실제 저장 아님)
    const previewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

    try {
      // Canvas 압축 (400×400, WebP)
      const optimized = await optimizeImage(file, 'avatar')
      setSizeInfo(`${formatFileSize(file.size)} → ${formatFileSize(optimized.size)}`)

      const supabase = createClient()
      const ext = optimized.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, optimized, { upsert: true, contentType: optimized.type })

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('bucket not found')) {
          throw new Error('스토리지 버킷이 설정되지 않았습니다. Supabase 대시보드 → SQL Editor에서 schema-storage.sql을 실행해 주세요.')
        }
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + `?t=${Date.now()}`

      await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
      setPreview(previewUrl)
      onUpload(url)
    } catch (err: any) {
      setError(err.message || String(err))
      setSizeInfo('')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center text-4xl cursor-pointer overflow-hidden hover:opacity-80 transition-opacity relative"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
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
        className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50"
      >
        {uploading ? '⏳ Optimizing & Uploading...' : '📷 Change Photo'}
      </button>
      {sizeInfo && (
        <p className="text-xs text-green-600 font-medium">✅ Compressed: {sizeInfo}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 font-medium text-center max-w-[200px]">❌ {error}</p>
      )}
      <p className="text-xs text-gray-400">JPG, PNG, WebP · Auto-compressed to WebP</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
