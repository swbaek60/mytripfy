'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

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
  const [applied, setApplied] = useState(alreadyApplied)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    setLoading(true)
    const supabase = createClient()

    // upsert: 기존 레코드(rejected/removed 포함)가 있으면 pending으로 재활성화, 없으면 신규 삽입
    const { error: upsertError } = await supabase
      .from('companion_applications')
      .upsert(
        { post_id: postId, applicant_id: userId, message: message || null, status: 'pending' },
        { onConflict: 'post_id,applicant_id' }
      )

    setLoading(false)
    if (!upsertError) {
      setApplied(true)
      setShowForm(false)
      router.refresh()
      // 호스트에게 이메일 알림 (비동기, 실패해도 UX 영향 없음)
      fetch('/api/email/companion-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, applicantId: userId, message: message || null }),
      }).catch(console.error)
    } else {
      console.error('Failed to upsert application:', JSON.stringify(upsertError))
      const code = (upsertError as { code?: string }).code ?? ''
      if (code === '23503') {
        alert('게시글을 찾을 수 없거나 접근할 수 없습니다.')
      } else if (upsertError.message?.includes('row-level security')) {
        alert('권한이 없습니다. 로그아웃 후 다시 로그인해 주세요.')
      } else {
        alert(`신청에 실패했습니다. (${upsertError.message || '알 수 없는 오류'})`)
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
        <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-700 font-medium">✅ You have applied for this trip!</p>
          <p className="text-green-600 text-sm mt-1">Waiting for the host to respond.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="border-red-200 text-red-500 hover:bg-red-50 shrink-0"
        >
          Cancel Application
        </Button>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Message to host (optional)</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Introduce yourself briefly — your travel style, experience, etc."
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-3">
          <Button
            onClick={handleApply}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            {loading ? 'Submitting...' : '🚀 Submit Application'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowForm(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowForm(true)}
      className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-6 text-lg font-bold"
    >
      ✈️ Apply to Join This Trip
    </Button>
  )
}
