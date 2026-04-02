'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function ApplyButton({
  postId,
  userId,
  locale,
  alreadyApplied,
  wasRemoved,
}: {
  postId: string
  userId: string
  locale: string
  alreadyApplied: boolean
  wasRemoved?: boolean
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
    const res = await fetch('/api/companion/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, message: message || null }),
    })
    const data = res.ok ? null : await res.json().catch(() => ({}))
    setLoading(false)

    if (res.ok) {
      setApplied(true)
      setShowForm(false)
      router.refresh()
      fetch('/api/email/companion-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, applicantId: userId, message: message || null }),
      }).catch(console.error)
    } else {
      if (res.status === 403) {
        alert(data?.error || t('applyGenderRestrict'))
      } else if (res.status === 404) {
        alert(t('applyNotFound'))
      } else {
        alert(data?.error || t('applyFailed'))
      }
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('companion_applications')
      .delete()
      .eq('post_id', postId)
      .eq('applicant_id', userId)
    setLoading(false)
    setApplied(false)
    router.refresh()
  }

  if (applied) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 bg-success-light border border-green-200 rounded-xl p-4 text-center">
          <p className="text-success font-medium">{t('appliedTrip')}</p>
          <p className="text-success text-sm mt-1">{t('waitingHost')}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="border-red-200 text-danger hover:bg-danger-light shrink-0"
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
          placeholder="Introduce yourself briefly — your travel style, experience, etc."
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
      className="w-full bg-brand hover:bg-brand-hover rounded-xl py-6 text-lg font-bold"
    >
      {t('applyJoin')}
    </Button>
  )
}
