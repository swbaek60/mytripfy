'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

interface Props {
  requestId: string
  locale: string
}

export default function DeleteGuideRequestButton({ requestId, locale }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('guide_requests').delete().eq('id', requestId)
    router.push(`/${locale}/guides/requests`)
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600 font-medium">정말 삭제할까요?</span>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full text-xs px-4"
        >
          {deleting ? '삭제 중...' : '삭제'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirm(false)}
          disabled={deleting}
          className="rounded-full text-xs px-4"
        >
          취소
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setConfirm(true)}
      className="rounded-full text-xs px-4 border-red-300 text-red-600 hover:bg-red-50"
    >
      🗑️ 삭제
    </Button>
  )
}
