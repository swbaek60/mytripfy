'use client'

import { useState } from 'react'
import { ApiError, api, errorMessage } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function ApplyButton({
  postId,
  alreadyApplied,
}: {
  postId: string
  alreadyApplied: boolean
}) {
  const router = useRouter()
  const t = useTranslations('CompanionDetail')
  const tc = useTranslations('Common')
  const [applied, setApplied] = useState(alreadyApplied)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    setLoading(true)
    try {
      await api.post('/api/companion/apply', { postId, message: message || null })
      setApplied(true)
      setShowForm(false)
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) alert(t('applyNotFound'))
      else alert(errorMessage(err, t('applyFailed')))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      await api.del('/api/companion/apply', { postId })
      setApplied(false)
      router.refresh()
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 bg-success-light border border-success-border rounded-xl p-4 text-center">
          <p className="text-success font-medium">{t('appliedTrip')}</p>
          <p className="text-success text-sm mt-1">{t('waitingHost')}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="border-danger-border text-danger hover:bg-danger-light shrink-0"
        >
          {t('cancelApp')}
        </Button>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-body">{t('messageToHost')}</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={t('applyMessagePlaceholder')}
          aria-label={t('messageToHost')}
          rows={4}
          className="w-full rounded-xl border border-edge px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <div className="flex gap-3">
          <Button
            onClick={handleApply}
            disabled={loading}
            className="flex-1 bg-brand hover:bg-brand-hover rounded-xl"
          >
            {loading ? t('submitting') : t('submitApp')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowForm(false)}
            className="rounded-xl"
          >
            {tc('cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowForm(true)}
      className="w-full bg-brand hover:bg-brand-hover rounded-xl py-5 text-base font-bold"
    >
      {t('applyJoin')}
    </Button>
  )
}
