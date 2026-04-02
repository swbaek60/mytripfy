'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Siren } from 'lucide-react'

export interface DisputeTargetCert {
  user_id: string
  challenge_id: string
  image_url: string
  full_name: string
  challenge_title?: string
}

interface Props {
  target: DisputeTargetCert
  onClose: () => void
  onSuccess: (userId: string, challengeId: string) => void
}

export default function DisputeModal({ target, onClose, onSuccess }: Props) {
  const t = useTranslations('Challenges')
  const tc = useTranslations('Common')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/challenges/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cert_user_id: target.user_id,
          cert_challenge_id: target.challenge_id,
          reason: reason.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || tc('errorSubmit'))
      }
      setSuccess(true)
      onSuccess(target.user_id, target.challenge_id)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tc('errorOccurred'))
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
                <Siren className="w-3.5 h-3.5" /> {t('disputeTitle')}
              </p>
              {target.challenge_title && (
                <h2 className="text-lg font-extrabold leading-tight">{target.challenge_title}</h2>
              )}
              <p className="text-sm opacity-80 mt-0.5">by {target.full_name}</p>
            </div>
            <button
              onClick={() => !submitting && onClose()}
              className="w-8 h-8 bg-surface/20 rounded-full flex items-center justify-center hover:bg-surface/30"
            >✕</button>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-3">
                <Siren className="w-14 h-14 text-danger" />
              </div>
              <p className="text-lg font-bold text-heading">{t('disputeSubmitted')}</p>
              <p className="text-sm text-subtle mt-1">{t('disputeJuryNote')}</p>
            </div>
          ) : (
            <>
              <div className="relative h-32 rounded-2xl overflow-hidden mb-4">
                <img src={target.image_url} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="bg-gold-light border border-gold/20 rounded-xl p-3 mb-4 text-sm text-gold">
                {t('disputeDepositWarning')}
              </div>

              <label className="block text-sm font-bold text-heading mb-2">
                {t('disputeReasonLabel')} <span className="text-danger">*</span>
                <span className="font-normal text-hint ml-1">{t('minCharsRequired', { count: reason.length })}</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={t('disputeReasonPlaceholder')}
                rows={4}
                className="w-full border border-edge rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <p className={`text-xs mt-1 ${reason.length < 10 ? 'text-red-400' : 'text-green-500'}`}>
                {t('minCharsRequired', { count: reason.length })}
              </p>

              {error && (
                <div className="mt-3 text-danger text-sm bg-danger-light p-3 rounded-xl">{error}</div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 border border-edge text-body font-semibold py-3 rounded-xl hover:bg-surface-hover transition-colors text-sm"
                >{tc('cancel')}</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || reason.trim().length < 10}
                  className="flex-1 bg-danger text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('processing')}</>
                    : <><Siren className="w-4 h-4" />{t('submitDispute')}</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
