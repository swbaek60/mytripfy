'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

const STEP_TRANSLATION_KEYS: Record<string, string> = {
  email: 'step_email',
  name: 'step_name',
  photo: 'step_photo',
  bio: 'step_bio',
  nation: 'step_nationality',
  langs: 'step_languages',
  contact: 'step_contact',
  visited: 'step_visited',
  photos: 'step_photos',
  guide: 'step_guide',
}

export default function DashboardCompletenessBanner({ locale }: { locale: string }) {
  const t = useTranslations('Profile')
  const [data, setData] = useState<{ percent: number; nextStepKey: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/profile/completeness')
      .then((res) => res.ok ? res.json() : null)
      .then((json) => json && setData({ percent: json.percent, nextStepKey: json.nextStepKey }))
      .catch(() => {})
  }, [])

  if (data === null) return null
  if (data.percent >= 100) return null

  const nextLabel = data.nextStepKey ? t(STEP_TRANSLATION_KEYS[data.nextStepKey] || 'step_name') : ''

  return (
    <Link href={`/${locale}/profile`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {data.percent}%
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {t('completenessTitle')} {data.percent}%
            </p>
            {data.nextStepKey && (
              <p className="text-xs text-gray-500 mt-0.5">
                {t('completenessNextPrefix')}{nextLabel}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
          {t('viewProfileLink')}
        </span>
      </div>
    </Link>
  )
}
