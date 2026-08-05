'use client'

import { useAuth } from '@clerk/nextjs'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  subtitle: string
  joinLabel: string
  browseLabel: string
}

export default function HomeFinalCta({ title, subtitle, joinLabel, browseLabel }: Props) {
  const { isSignedIn } = useAuth()
  if (isSignedIn) return null

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-brand via-brand-deep to-midnight relative overflow-hidden">
      <div className="relative max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{title}</h2>
        <p className="text-white/70 text-lg mb-10">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-white text-brand hover:bg-brand-light rounded-full px-10 font-bold w-full sm:w-auto">
              {joinLabel}
            </Button>
          </Link>
          <Link href="/companions">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white rounded-full px-10 w-full sm:w-auto"
            >
              {browseLabel}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
