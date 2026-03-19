'use client'

import { useEffect } from 'react'
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
  useEffect(() => {
    console.error('Route segment error:', error?.message, error?.digest)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/" className="mb-8">
        <Logo className="h-10" />
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 text-center max-w-sm mb-6">
        We couldn’t load this page. Please try again or go back home.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => reset()} variant="default" className="rounded-full">
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
