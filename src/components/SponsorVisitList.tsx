'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, Siren } from 'lucide-react'
import { getCountryByCode } from '@/data/countries'
import { useTranslations } from 'next-intl'

export type SponsorVisitItem = {
  id: string
  sponsor_id: string
  photo_url: string
  points_granted: number
  created_at: string
  sponsors: { id: string; name: string | null; name_en: string | null; country_code: string | null; city: string | null } | null
}

export default function SponsorVisitList({
  visits,
  locale,
  isOwnProfile,
  currentUserId,
  myCertCount = 0,
  myDisputedVisitIds = new Set<string>(),
}: {
  visits: SponsorVisitItem[]
  locale: string
  isOwnProfile: boolean
  currentUserId?: string | null
  myCertCount?: number
  myDisputedVisitIds?: Set<string>
}) {
  const t = useTranslations('SponsorVisit')
  const router = useRouter()
  const [disputedIds, setDisputedIds] = useState<Set<string>>(myDisputedVisitIds)
  const [disputeTarget, setDisputeTarget] = useState<{ visitId: string; storeName: string; photoUrl: string } | null>(null)

  const canDispute = !!currentUserId && !isOwnProfile && myCertCount >= 3

  if (visits.length === 0) return null

  return (
    <>
      <div className="bg-surface rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-heading text-lg flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-emerald-500" />
          {t('sponsorVisits')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visits.map((v) => {
            const sponsor = v.sponsors
            const displayName = locale.startsWith('ko') && sponsor?.name ? sponsor.name : (sponsor?.name_en || sponsor?.name || '–')
            const countryInfo = sponsor?.country_code ? getCountryByCode(sponsor.country_code) : null
            const alreadyDisputed = disputedIds.has(v.id)

            return (
              <div key={v.id} className="group relative rounded-xl border border-edge overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all">
                <Link href={`/${locale}/sponsors/${v.sponsor_id}`} className="block">
                  <div className="aspect-square bg-surface-sunken relative group/img">
                    <img
                      src={v.photo_url}
                      alt=""
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      +{v.points_granted}pt
                    </div>
                    {!isOwnProfile && canDispute && !alreadyDisputed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDisputeTarget({ visitId: v.id, storeName: displayName, photoUrl: v.photo_url })
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-danger/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all shadow-lg z-10"
                        title={t('report')}
                      >
                        <Siren className="w-3 h-3" />
                      </button>
                    )}
                    {alreadyDisputed && (
                      <div className="absolute top-1 right-1 bg-gray-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {t('reported')}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-semibold text-heading text-sm truncate">{displayName}</p>
                    {countryInfo && (
                      <p className="text-xs text-subtle flex items-center gap-0.5 mt-0.5">
                        {countryInfo.emoji} {sponsor?.city || countryInfo.name}
                      </p>
                    )}
                    <p className="text-[10px] text-hint mt-1">
                      {new Date(v.created_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
        <Link
          href={`/${locale}/sponsors`}
          className="inline-block mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          {t('viewAllSponsors')} →
        </Link>
      </div>

      {disputeTarget && (
        <SponsorVisitDisputeModal
          visitId={disputeTarget.visitId}
          storeName={disputeTarget.storeName}
          photoUrl={disputeTarget.photoUrl}
          onClose={() => setDisputeTarget(null)}
          onSuccess={() => {
            setDisputedIds((prev) => new Set([...prev, disputeTarget.visitId]))
            setDisputeTarget(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function SponsorVisitDisputeModal({
  visitId,
  storeName,
  photoUrl,
  onClose,
  onSuccess,
}: {
  visitId: string
  storeName: string
  photoUrl: string
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations('SponsorVisit')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/sponsors/visit/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_id: visitId, reason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('reportFailed'))
      setSuccess(true)
      onSuccess()
      setTimeout(onClose, 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('errorOccurred'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="relative bg-surface rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1">
                <Siren className="w-3.5 h-3.5" /> {t('reportTitle')}
              </p>
              <h2 className="text-lg font-extrabold leading-tight">{storeName}</h2>
              <p className="text-sm opacity-80 mt-0.5">{t('sponsorVisitLabel')}</p>
            </div>
            <button type="button" onClick={() => !submitting && onClose()} className="w-8 h-8 bg-surface/20 rounded-full flex items-center justify-center hover:bg-surface/30">✕</button>
          </div>
        </div>
        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <Siren className="w-14 h-14 text-danger mx-auto mb-3" />
              <p className="text-lg font-bold text-heading">{t('reportSubmitted')}</p>
            </div>
          ) : (
            <>
              <div className="relative h-32 rounded-2xl overflow-hidden mb-4">
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <label className="block text-sm font-bold text-heading mb-2">
                {t('reason')} <span className="text-danger">*</span>
                <span className="font-normal text-hint ml-1">({t('minChars')})</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reportPlaceholder')}
                rows={4}
                className="w-full border border-edge rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <p className={`text-xs mt-1 ${reason.length < 10 ? 'text-red-400' : 'text-success'}`}>
                {reason.length} / 10
              </p>
              {error && <div className="mt-3 text-danger text-sm bg-danger-light p-3 rounded-xl">{error}</div>}
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={onClose} disabled={submitting} className="flex-1 border border-edge text-body font-semibold py-3 rounded-xl hover:bg-surface-hover text-sm">
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || reason.trim().length < 10}
                  className="flex-1 bg-danger text-white font-bold py-3 rounded-xl hover:bg-red-600 text-sm disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Siren className="w-4 h-4" />{t('submit')}</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
