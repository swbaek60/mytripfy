'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, errorMessage } from '@/lib/client/api'
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
    try {
      await api.del('/api/guide-requests', { id: requestId })
      router.push(`/${locale}/guides/requests`)
    } catch (err) {
      alert(errorMessage(err))
      setDeleting(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-danger font-medium">{tc('deleteConfirm')}</span>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-danger hover:bg-danger-strong text-white rounded-full text-xs px-4"
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
      className="rounded-full text-xs px-4 border-danger-border text-danger hover:bg-danger-light"
    >
      🗑️ {tc('delete')}
    </Button>
  )
}
