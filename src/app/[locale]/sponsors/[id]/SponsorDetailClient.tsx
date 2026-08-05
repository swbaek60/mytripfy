'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Benefit = {
  id: string
  title: string
  title_en?: string | null
  end_date: string
  benefit_type: string
  value_num?: number | null
  value_text?: string | null
}

export default function SponsorDetailClient({
  locale,
  sponsorId,
  sponsorName,
  benefit,
  isOwner,
  visitOnly,
  pointsEarned = 10,
}: {
  locale: string
  sponsorId: string
  sponsorName: string
  benefit: Benefit | null
  isOwner: boolean
  visitOnly?: boolean
  pointsEarned?: number
}) {
  const t = useTranslations('Sponsors')
  const router = useRouter()
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [visitError, setVisitError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  if (visitOnly) {
    return (
      <>
        <Button
          onClick={() => setShowVisitModal(true)}
          className="rounded-full bg-success-strong hover:bg-success-strong text-white"
        >
          ✓ {t('visitAndVerify')}
        </Button>
        {visitError && <p className="text-sm text-danger mt-1">{visitError}</p>}
        {showVisitModal && (
          <VisitVerifyModal
            sponsorName={sponsorName}
            sponsorId={sponsorId}
            pointsEarned={pointsEarned ?? 10}
            uploading={uploading}
            setUploading={setUploading}
            onError={setVisitError}
            showSuccess={showSuccess}
            onClose={() => {
              setShowVisitModal(false)
              setVisitError('')
            }}
            onSuccess={() => {
              setShowSuccess(true)
              setTimeout(() => {
                setShowVisitModal(false)
                router.refresh()
              }, 2500)
            }}
            t={t}
          />
        )}
      </>
    )
  }

  if (isOwner || !benefit) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 shrink-0 items-center">
        <Link
          href={`/${locale}/sponsors/${sponsorId}/coupon/${benefit.id}`}
          className="inline-flex items-center justify-center rounded-full bg-success-strong hover:bg-success-strong text-white text-sm font-medium px-4 py-2 whitespace-nowrap"
        >
          📷 {t('viewCoupon')}
        </Link>
      </div>
      {visitError && <p className="text-sm text-danger mt-1">{visitError}</p>}
    </>
  )
}

function VisitVerifyModal({
  sponsorName,
  sponsorId,
  pointsEarned,
  uploading,
  setUploading,
  onError,
  showSuccess,
  onClose,
  onSuccess,
  t,
}: {
  sponsorName: string
  sponsorId: string
  pointsEarned: number
  uploading: boolean
  setUploading: (v: boolean) => void
  onError: (msg: string) => void
  showSuccess: boolean
  onClose: () => void
  onSuccess: () => void
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const tc = useTranslations('Common')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || uploading) return
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file.')
      return
    }
    setUploading(true)
    onError('')
    try {
      const form = new FormData()
      form.append('sponsorId', sponsorId)
      form.append('photo', file)
      const res = await fetch('/api/sponsors/visit', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onSuccess()
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to submit.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !uploading && onClose()}
      />
      <div className="relative bg-surface rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="relative h-28 bg-gradient-to-r from-success to-teal flex items-end p-4">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative">
            <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{t('visitAndVerify')}</p>
            <h3 className="text-white font-bold text-lg leading-tight">{sponsorName}</h3>
          </div>
          <button
            type="button"
            onClick={() => !uploading && onClose()}
            aria-label={tc('close')}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60"
          >
            ✕
          </button>
        </div>

        <div className="p-6 text-center">
          {showSuccess ? (
            <div className="py-6 animate-in zoom-in duration-300">
              <div className="text-6xl mb-3">🎊</div>
              <h3 className="text-2xl font-bold text-heading mb-1">{t('visitSuccessTitle')}</h3>
              <p className="text-success font-bold text-lg">+{pointsEarned} pt</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-body text-left mb-4">{t('visitVerifyDesc')}</p>

              <div className="border-2 border-dashed border-success-border rounded-2xl p-8 hover:bg-success-light/50 transition-colors relative cursor-pointer group">
                <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">📸</div>
                <div className="text-sm font-bold text-success-strong">{t('uploadPhoto')}</div>
                <div className="text-xs text-hint mt-1">{t('visitVerifyHint')}</div>
                <input
                  type="file"
                  accept="image/*"
                  aria-label={tc('selectPhoto')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-success">
                  <div className="w-4 h-4 border-2 border-success border-t-transparent rounded-full animate-spin" />
                  {t('visitUploading')}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="mt-5 text-sm text-hint hover:text-subtle disabled:opacity-50"
              >
                {tc('cancel')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
