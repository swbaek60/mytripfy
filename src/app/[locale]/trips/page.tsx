import { createClient } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { CalendarDays, Globe, Lock, Plus, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trip Plans | mytripfy',
  description: 'Plan your day-by-day travel itinerary and share it with the community.',
}

export default async function TripsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const myTrips = (myTripsRes.data ?? []) as any[]
  const publicTrips = (publicTripsRes.data ?? []).filter(
    (t: any) => t.user_id !== user?.id
  ) as any[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user || null} locale={locale} currentPath="/trips" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* My Trips */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Trip Plans</h1>
              <p className="text-sm text-gray-500 mt-0.5">Day-by-day itineraries you've created</p>
            </div>
            {user && (
              <Link href={`/${locale}/trips/new`}>
                <Button className="rounded-full gap-1.5 text-sm">
                  <Plus size={15} /> New Trip
                </Button>
              </Link>
            )}
          </div>

          {!user ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <p className="text-gray-500 mb-4">Log in to create and manage your own trip itineraries.</p>
              <Link href={`/${locale}/login`}>
                <Button className="rounded-full px-8">Login to Start Planning</Button>
              </Link>
            </div>
          ) : myTrips.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <p className="text-gray-400 text-sm mb-4">No trip plans yet. Start by creating your first itinerary!</p>
              <Link href={`/${locale}/trips/new`}>
                <Button variant="outline" className="rounded-full">Create your first trip</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myTrips.map((trip: any) => <TripCard key={trip.id} trip={trip} locale={locale} showOwner={false} />)}
            </div>
          )}
        </section>

        {/* Explore Public Trips */}
        {publicTrips.length > 0 && (
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">Explore Public Itineraries</h2>
              <p className="text-sm text-gray-500 mt-0.5">Discover travel plans shared by the community</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicTrips.map((trip: any) => <TripCard key={trip.id} trip={trip} locale={locale} showOwner />)}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

function TripCard({ trip, locale, showOwner }: { trip: any; locale: string; showOwner: boolean }) {
  const country = trip.destination_country ? getCountryByCode(trip.destination_country) : null
  const start = trip.start_date ? new Date(trip.start_date + 'T00:00:00') : null
  const end   = trip.end_date   ? new Date(trip.end_date   + 'T00:00:00') : null
  const dateLabel = start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
    ? `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : null
  const dayCount = trip.trip_days?.[0]?.count ?? 0

  return (
    <Link href={`/${locale}/trips/${trip.id}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-transparent hover:border-blue-100 hover:shadow-md transition-all p-5 cursor-pointer h-full flex flex-col">
        {/* Country flag + visibility */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{country?.emoji || '✈️'}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
            trip.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {trip.visibility === 'public' ? <Globe size={10} /> : <Lock size={10} />}
            {trip.visibility === 'public' ? 'Public' : 'Private'}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 flex-1">{trip.title}</h3>

        <div className="space-y-1.5 mt-auto">
          {country && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin size={11} className="text-gray-400" />
              {country.name}
            </p>
          )}
          {dateLabel && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarDays size={11} className="text-gray-400" />
              {dateLabel}
            </p>
          )}
          {dayCount > 0 && (
            <p className="text-xs text-blue-600 font-medium">{dayCount} day{dayCount > 1 ? 's' : ''} planned</p>
          )}
        </div>

        {/* Owner info */}
        {showOwner && trip.profiles && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs overflow-hidden shrink-0">
              {trip.profiles.avatar_url
                ? <img src={trip.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-gray-400">?</span>}
            </div>
            <span className="text-xs text-gray-500 truncate">{trip.profiles.full_name || 'Anonymous'}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
