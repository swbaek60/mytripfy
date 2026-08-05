import { createClient, getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { CalendarDays, Globe, Lock, Plus, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import Avatar from '@/components/ui/Avatar'
import { relationOne, type ProfileRef } from '@/lib/db/relation'

interface TripCardData {
  id: string
  user_id: string
  title: string
  destination_country: string | null
  start_date: string | null
  end_date: string | null
  visibility: 'public' | 'private'
  /** `trip_days(count)` 임베드는 `[{ count: n }]` 모양으로 온다. */
  trip_days?: { count: number }[] | null
  profiles?: ProfileRef | ProfileRef[] | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SeoPages' })
  return buildPageMetadata({
    locale,
    path: '/trips',
    title: t('tripsTitle'),
    description: t('tripsDesc'),
    keywords: ['travel itinerary', 'trip plan', 'shared trips', 'mytripfy'],
  })
}

export default async function TripsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Trips' })
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  const ts = await getTranslations({ locale, namespace: 'SeoPages' })
  const td = await getTranslations({ locale, namespace: 'Dashboard' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  const [myTripsRes, publicTripsRes] = await Promise.all([
    user
      ? supabase
          .from('trips')
          .select('*, trip_days(count)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('trips')
      .select('*, profiles!trips_user_id_fkey(full_name, avatar_url), trip_days(count)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const myTrips = (myTripsRes.data ?? []) as TripCardData[]
  const publicTrips = ((publicTripsRes.data ?? []) as TripCardData[]).filter(
    (t) => t.user_id !== user?.id
  )

  return (
    <div className="min-h-screen bg-surface-warm">
      <Header locale={locale} />

      <section className="relative bg-midnight text-white py-12 sm:py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-midnight to-brand-deep/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">{tm('tripsHeroTitle')}</h1>
          <p className="text-white/70 max-w-xl leading-relaxed">{tm('tripsHeroSubtitle')}</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* My Trips */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-heading">{td('myTripPlans')}</h1>
              <p className="text-sm text-subtle mt-0.5">{t('itinerariesCreated')}</p>
            </div>
            {user && (
              <Link href={`/${locale}/trips/new`}>
                <Button className="rounded-full gap-1.5 text-sm shadow-md shadow-brand/20">
                  <Plus size={15} /> {t('newTrip')}
                </Button>
              </Link>
            )}
          </div>

          {!user ? (
            <div className="bg-surface rounded-2xl shadow-sm border border-edge/60 p-8 text-center">
              <p className="text-subtle mb-4">{ts('tripsLoginHint')}</p>
              <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/trips`)}`}>
                <Button className="rounded-full px-8 shadow-md shadow-brand/20">{ts('tripsLoginCta')}</Button>
              </Link>
            </div>
          ) : myTrips.length === 0 ? (
            <div className="bg-surface rounded-2xl shadow-sm border border-edge/60 p-10 text-center">
              <p className="text-hint text-sm mb-4">{t('noTripPlans')}</p>
              <Link href={`/${locale}/trips/new`}>
                <Button variant="outline" className="rounded-full border-brand/30 text-brand hover:bg-brand-light">{ts('tripsCreateFirst')}</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {myTrips.map((trip) => <TripCard key={trip.id} trip={trip} locale={locale} showOwner={false} />)}
            </div>
          )}
        </section>

        {/* Explore Public Trips */}
        {publicTrips.length > 0 && (
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-heading">{ts('tripsExplorePublic')}</h2>
              <p className="text-sm text-subtle mt-0.5">{ts('tripsExplorePublicHint')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicTrips.map((trip) => <TripCard key={trip.id} trip={trip} locale={locale} showOwner />)}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

async function TripCard({ trip, locale, showOwner }: { trip: TripCardData; locale: string; showOwner: boolean }) {
  const t = await getTranslations({ locale, namespace: 'Trips' })
  const tc = await getTranslations({ locale, namespace: 'Common' })
  const owner = relationOne<ProfileRef>(trip.profiles)
  const country = trip.destination_country ? getCountryByCode(trip.destination_country) : null
  const start = trip.start_date ? new Date(trip.start_date + 'T00:00:00') : null
  const end   = trip.end_date   ? new Date(trip.end_date   + 'T00:00:00') : null
  const dateLabel = start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
    ? `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : null
  const dayCount = trip.trip_days?.[0]?.count ?? 0

  return (
    <Link href={`/${locale}/trips/${trip.id}`} className="group block h-full">
      <div className="bg-surface rounded-2xl shadow-sm border border-edge/60 hover:border-edge-brand hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 h-full flex flex-col">
        {/* Country flag + visibility */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{country?.emoji || '✈️'}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
            trip.visibility === 'public' ? 'bg-success-light text-success-strong' : 'bg-surface-sunken text-subtle'
          }`}>
            {trip.visibility === 'public' ? <Globe size={10} /> : <Lock size={10} />}
            {trip.visibility === 'public' ? t('public') : t('private')}
          </span>
        </div>

        <h3 className="font-bold text-heading text-sm leading-snug mb-2 line-clamp-2 flex-1 group-hover:text-brand transition-colors">{trip.title}</h3>

        <div className="space-y-1.5 mt-auto">
          {country && (
            <p className="flex items-center gap-1.5 text-xs text-subtle">
              <MapPin size={11} className="text-hint" />
              {country.name}
            </p>
          )}
          {dateLabel && (
            <p className="flex items-center gap-1.5 text-xs text-subtle">
              <CalendarDays size={11} className="text-hint" />
              {dateLabel}
            </p>
          )}
          {dayCount > 0 && (
            <p className="text-xs text-brand font-medium">{t('daysPlanned', { count: dayCount })}</p>
          )}
        </div>

        {/* Owner info */}
        {showOwner && owner && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-edge">
            <Avatar src={owner.avatar_url} name={owner.full_name} size={20} fallbackClassName="bg-brand-muted text-brand-strong" />
            <span className="text-xs text-subtle truncate">{owner.full_name || tc('anonymous')}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
