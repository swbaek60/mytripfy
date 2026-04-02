'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface Props {
  requestId: string
  locale: string
}

export default function DeleteGuideRequestButton({ requestId, locale }: Props) {
  const router = useRouter()
  const tc = useTranslations('Common')
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
        <span className="text-sm text-danger font-medium">{tc('deleteConfirm')}</span>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-danger hover:bg-red-700 text-white rounded-full text-xs px-4"
        >
          {deleting ? tc('deleting') : tc('delete')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirm(false)}
          disabled={deleting}
          className="rounded-full text-xs px-4"
        >
          {tc('cancel')}
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setConfirm(true)}
      className="rounded-full text-xs px-4 border-red-300 text-danger hover:bg-danger-light"
    >
      🗑️ {tc('delete')}
    </Button>
  )
}
