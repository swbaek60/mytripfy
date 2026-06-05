'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
  locale: string
  postId: string
  alreadyApplied: boolean
  isOwner: boolean
  isLoggedIn: boolean
}

export default function CompanionStickyCta({
  locale,
  postId,
  alreadyApplied,
  isOwner,
  isLoggedIn,
}: Props) {
  const t = useTranslations('CompanionDetail')

  if (isOwner) return null

  const label = alreadyApplied ? t('appliedTrip') : t('applyJoin')

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface/95 backdrop-blur-lg border-t border-edge px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {isLoggedIn ? (
        <Link
          href={`/${locale}/companions/${postId}#apply`}
          className="block w-full text-center bg-brand hover:bg-brand-hover text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          {label}
        </Link>
      ) : (
        <Link
          href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/companions/${postId}`)}`}
          className="block w-full text-center bg-brand hover:bg-brand-hover text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          {t('loginToApply')}
        </Link>
      )}
    </div>
  )
}
