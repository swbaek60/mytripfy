'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function SponsorMyVisitCard({
  visitId,
  photoUrl,
  pointsGranted,
  createdAt,
  locale,
}: {
  visitId: string
  photoUrl: string
  pointsGranted: number
  createdAt: string
  locale: string
}) {
  const t = useTranslations('Sponsors')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [replaceError, setReplaceError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleReplacePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || uploading) return
    if (!file.type.startsWith('image/')) {
      setReplaceError('Please select an image file.')
      return
    }
    setUploading(true)
    setReplaceError('')
    try {
      const form = new FormData()
      form.append('visitId', visitId)
      form.append('photo', file)
      const res = await fetch('/api/sponsors/visit/update', { method: 'PATCH', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowReplaceModal(false)
      router.refresh()
    } catch (err: unknown) {
      setReplaceError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('deleteVisitConfirmOwner'))) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/sponsors/visit/update?visitId=${visitId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      window.location.reload()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setDeleting(false)
    }
  }

  const dateStr = new Date(createdAt).toLocaleDateString(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">
        {t('myVisitVerification')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0" style={{ width: 160, height: 160 }}>
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col justify-center gap-2">
          <p className="text-xs text-gray-500">{dateStr}</p>
          <p className="text-sm font-semibold text-emerald-600">+{pointsGranted} pt</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReplaceModal(true)}
              disabled={uploading}
              className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              {t('changePhoto')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
            >
              {deleting ? '...' : t('delete')}
            </Button>
          </div>
        </div>
      </div>

      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !uploading && setShowReplaceModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">{t('changePhoto')}</h3>
            <label className="block border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleReplacePhoto} disabled={uploading} />
              <span className="text-4xl block mb-2">📸</span>
              <span className="text-sm font-medium text-emerald-700">
                {uploading ? t('uploading') : t('selectNewPhoto')}
              </span>
            </label>
            {replaceError && <p className="text-sm text-red-600 mt-2">{replaceError}</p>}
            <Button type="button" variant="ghost" className="mt-3 w-full" onClick={() => !uploading && setShowReplaceModal(false)}>
              {tCommon('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
