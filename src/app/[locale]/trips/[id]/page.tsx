import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import { getCountryByCode } from '@/data/countries'
import ItineraryEditor from '@/components/ItineraryEditor'
import ItineraryView from '@/components/ItineraryView'
import { CalendarDays, Globe, Lock, Pencil } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { normalizeItineraryDays } from '@/types/itinerary'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd, buildTripJsonLd } from '@/lib/seo/json-ld'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: trip } = await supabase
    .from('trips')
    .select('title, description, visibility, destination_country')
    .eq('id', id)
    .maybeSingle()

  if (!trip) return {}

  const t = await getTranslations({ locale, namespace: 'Trips' })
  const country = trip.destination_country ? getCountryByCode(trip.destination_country) : null

  return buildPageMetadata({
    locale,
    path: `/trips/${id}`,
    title: trip.title,
    description: trip.description?.slice(0, 160) || t('createSubtitle'),
    openGraphType: 'article',
    // 비공개 일정은 본인만 볼 수 있다. 검색에 흘러 들어가면 안 된다.
    noindex: trip.visibility !== 'public',
    keywords: [t('dayByDayItinerary'), ...(country ? [country.name] : [])],
  })
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'Trips' })
  const tc = await getTranslations({ locale, namespace: 'Common' })
  const td = await getTranslations({ locale, namespace: 'Dashboard' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!trip) notFound()
  if (trip.visibility !== 'public' && trip.user_id !== user?.id) notFound()

  const isOwner = user?.id === trip.user_id

  // Day + Activity 데이터 fetch
  const { data: daysRaw } = await supabase
    .from('trip_days')
    .select('*, trip_activities(*)')
    .eq('trip_id', id)
    .order('day_number', { ascending: true })

  const days = normalizeItineraryDays(daysRaw)

  const country = trip.destination_country ? getCountryByCode(trip.destination_country) : null

  const start = trip.start_date ? new Date(trip.start_date + 'T00:00:00') : null
  const end   = trip.end_date   ? new Date(trip.end_date   + 'T00:00:00') : null
  const dateLabel =
    start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
      ? `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`
      : null

  const totalDays = start && end ? Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1 : null

  // 비공개 일정은 색인 대상이 아니므로 구조화 데이터도 내보내지 않는다.
  const isPublic = trip.visibility === 'public'

  return (
    <div className="min-h-screen bg-surface-sunken">
      {isPublic && (
        <>
          <JsonLdScript
            data={buildTripJsonLd({
              locale,
              tripId: id,
              name: trip.title,
              description: trip.description,
              startDate: trip.start_date,
              endDate: trip.end_date,
              countryCode: trip.destination_country,
            })}
          />
          <JsonLdScript
            data={buildBreadcrumbJsonLd(locale, [
              { name: td('myTripPlans'), path: '/trips' },
              { name: trip.title, path: `/trips/${id}` },
            ])}
          />
        </>
      )}
      <Header locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Trip Header Card */}
        <section className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          {/* Cover gradient */}
          <div className="h-20 bg-gradient-to-r from-brand to-indigo flex items-end px-6 pb-3">
            <span className="text-4xl">{country?.emoji || '✈️'}</span>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-heading leading-snug">{trip.title}</h1>
              {isOwner && (
                <Link
                  href={`/${locale}/trips/${trip.id}/edit`}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-edge-brand text-brand hover:bg-brand-light shrink-0 font-medium"
                >
                  <Pencil size={12} /> {tc('edit')}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-subtle">
              {country && (
                <span className="flex items-center gap-1.5">
                  <Globe size={14} className="text-hint" />
                  {country.emoji} {country.name}
                </span>
              )}
              {dateLabel && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-hint" />
                  {dateLabel}
                  {totalDays && <span className="text-hint">({totalDays}d)</span>}
                </span>
              )}
              <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                trip.visibility === 'public' ? 'bg-success-light text-success-strong' : 'bg-surface-sunken text-subtle'
              }`}>
                {trip.visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                {trip.visibility === 'public' ? t('public') : t('private')}
              </span>
            </div>

            {trip.description && (
              <p className="mt-4 text-sm text-body leading-relaxed bg-surface-sunken rounded-xl p-4">
                {trip.description}
              </p>
            )}
          </div>
        </section>

        {/* Itinerary Section */}
        <section className="bg-surface rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-heading">{t('dayByDayItinerary')}</h2>
              <p className="text-xs text-hint mt-0.5">
                {days.length > 0
                  ? `${t('daysCount', { count: days.length })} · ${t('activitiesCount', { count: days.flatMap(d => d.trip_activities).length })}`
                  : t('planStepByStep')}
              </p>
            </div>
          </div>

          {isOwner ? (
            <ItineraryEditor
              tripId={trip.id}
              startDate={trip.start_date}
              initialDays={days}
            />
          ) : (
            <ItineraryView days={days} />
          )}
        </section>

      </main>
    </div>
  )
}
