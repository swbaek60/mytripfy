'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'

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
      <Logo className="h-10 mb-8" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 text-center max-w-sm mb-6">
        We couldn’t load this page. Please try again.
      </p>
      <Button onClick={() => reset()} className="rounded-full">
        Try again
      </Button>
    </div>
  )
}
