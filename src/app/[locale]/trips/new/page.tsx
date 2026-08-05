import { getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import TripForm from '../TripForm'

import type { Metadata } from 'next'
import { buildPrivateMetadata } from '@/lib/seo/private-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPrivateMetadata({ locale, path: '/trips/new', namespace: 'SeoPages', titleKey: 'tripCreateTitle' })
}

export default async function NewTripPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!(await getAuthUser())) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <TripForm locale={locale} />
      </main>
    </div>
  )
}

