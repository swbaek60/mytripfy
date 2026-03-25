'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ApplyAsGuideButton({
  requestId,
  guideId,
  locale,
  alreadyApplied,
}: {
  requestId: string
  guideId: string
  locale: string
  alreadyApplied: boolean
}) {
  const router = useRouter()
  const [applied, setApplied] = useState(alreadyApplied)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('guide_applications').delete().eq('request_id', requestId).eq('guide_id', guideId)
    const { error: insertError } = await supabase
      .from('guide_applications')
      .insert({ request_id: requestId, guide_id: guideId, message: message || null })
    setLoading(false)
    if (!insertError) {
      setApplied(true)
      setShowForm(false)
      // 요청 작성자에게 이메일 발송 (비동기)
      fetch('/api/email/guide-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, guideId }),
      }).catch(console.error)
      router.refresh()
    } else {
      alert('Application failed. Please try again.')
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('guide_applications').delete().eq('request_id', requestId).eq('guide_id', guideId)
    setLoading(false)
    setApplied(false)
    router.refresh()
  }

  if (applied) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 bg-success-light border border-green-200 rounded-xl p-4 text-center">
          <p className="text-success font-medium">You have applied as guide for this request.</p>
          <p className="text-success text-sm mt-1">Waiting for the traveler to respond.</p>
        </div>
        <Button variant="outline" onClick={handleCancel} disabled={loading} className="border-red-200 text-danger hover:bg-danger-light shrink-0">
          Cancel Application
        </Button>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-body">Message to traveler (optional)</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Introduce yourself and your guide experience..."
          rows={4}
          className="w-full rounded-xl border border-edge px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="flex gap-3">
          <Button onClick={handleApply} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-xl text-white">
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
          <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <Button onClick={() => setShowForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 rounded-xl py-6 text-lg font-bold text-white">
      Apply as Guide
    </Button>
  )
}
