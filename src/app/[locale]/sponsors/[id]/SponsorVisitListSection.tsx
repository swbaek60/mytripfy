'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import SponsorVisitListCard from './SponsorVisitListCard'

type Visit = {
  id: string
  user_id: string
  photo_url: string
  created_at: string
  points_granted: number
  profiles?: { full_name: string | null } | null
}

export default function SponsorVisitListSection({
  sponsorId,
  locale,
  canDelete,
}: {
  sponsorId: string
  locale: string
  canDelete: boolean
}) {
  const t = useTranslations('Sponsors')
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    fetch(`/api/sponsors/${sponsorId}/visits`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data?.error) setError(data.error)
        else if (Array.isArray(data.visits)) setVisits(data.visits)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [sponsorId])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
      <h2 className="font-bold text-gray-900 mb-1">
        {t('visitVerifications')}
      </h2>
      {loading ? (
        <p className="text-sm text-gray-500">{t('loadingVisits')}</p>
      ) : error ? (
        <p className="text-sm text-amber-600">{error}</p>
      ) : visits.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t('noVerifiedVisitsYet')}
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {t('otherVisitsCount', { count: visits.length })}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {visits.map((v) => (
              <SponsorVisitListCard
                key={v.id}
                visit={v}
                locale={locale}
                canDelete={canDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
