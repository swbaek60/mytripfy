'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

type Visit = {
  id: string
  photo_url: string
  created_at: string
  points_granted: number
  profiles?: { full_name: string | null } | null
}

export default function SponsorVisitListCard({
  visit,
  locale,
  canDelete,
}: {
  visit: Visit
  locale: string
  canDelete: boolean
}) {
  const t = useTranslations('Sponsors')
  const [deleting, setDeleting] = useState(false)
  const name = visit.profiles?.full_name || t('visitor')
  const dateStr = new Date(visit.created_at).toLocaleDateString(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleDelete = async () => {
    if (!confirm(t('deleteVisitConfirm'))) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/sponsors/visit/update?visitId=${visit.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      window.location.reload()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative group">
      <div className="aspect-square relative">
        <img src={visit.photo_url} alt="" className="w-full h-full object-cover" />
        {canDelete && (
          <div className="absolute top-1 right-1">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-7 px-2 text-xs opacity-90 hover:opacity-100"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t('deleting') : t('delete')}
            </Button>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-gray-800 truncate" title={name}>{name}</p>
        <p className="text-[10px] text-gray-500">{dateStr}</p>
        <p className="text-[10px] text-emerald-600 font-medium">+{visit.points_granted} pt</p>
      </div>
    </div>
  )
}
