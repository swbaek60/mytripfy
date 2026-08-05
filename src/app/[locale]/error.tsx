'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import { Link } from '@/i18n/routing'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Errors')

  useEffect(() => {
    console.error('Route segment error:', error?.message, error?.digest)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-sunken px-4">
      <Link href="/" className="mb-8">
        <Logo className="h-10 sm:h-11" priority />
      </Link>
      <h1 className="text-xl font-bold text-heading mb-2">{t('somethingWentWrong')}</h1>
      <p className="text-body text-center max-w-sm mb-6">{t('loadFailedBody')}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => reset()} variant="default" className="rounded-full">
          {t('tryAgain')}
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">{t('goHome')}</Link>
        </Button>
      </div>
    </div>
  )
}
