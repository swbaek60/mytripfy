import { createClient, getAuthUser } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import { getCountryByCode } from '@/data/countries'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ApplyAsGuideButton from './ApplyAsGuideButton'
import GuideApplicationsList from './GuideApplicationsList'
import DeleteGuideRequestButton from './DeleteGuideRequestButton'
import type { Metadata } from 'next'
import { getLanguageByCode } from '@/data/languages'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import TranslatedText from '@/components/TranslatedText'
import Avatar from '@/components/ui/Avatar'
import SmartImage from '@/components/ui/SmartImage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: req } = await supabase.from('guide_requests').select('title, destination_country, start_date').eq('id', id).single()
  if (!req) return { title: 'Guide Request Not Found' }
  const country = getCountryByCode(req.destination_country)
  const place = country?.name || req.destination_country
  return buildPageMetadata({
    locale,
    path: `/guides/requests/${id}`,
    title: `${req.title} – ${place}`,
    description: `Find a local guide for your trip to ${place} on mytripfy.`,
    openGraphType: 'article',
    keywords: ['guide request', 'local guide', place, 'mytripfy'],
  })
}

export default async function GuideRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'GuideRequests' })
  const tc = await getTranslations({ locale, namespace: 'Common' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  const { data: request } = await supabase
    .from('guide_requests')
    .select('*, profiles (id, full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (!request) notFound()

  const { data: applications } = await supabase
    .from('guide_applications')
    .select('*, profiles (id, full_name, avatar_url, travel_level)')
    .eq('request_id', id)
    .order('created_at', { ascending: true })

  const destCountry = getCountryByCode(request.destination_country)
  const author = request.profiles as Record<string, unknown>
  const startDate = new Date(request.start_date)
  const endDate = new Date(request.end_date)
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const isExpired = endDate < new Date(new Date().toDateString())
  const effectiveStatus = isExpired ? 'ended' : request.status
  const isOwner = user?.id === author?.id

  const myApplication = applications?.find((a: { guide_id: string }) => a.guide_id === user?.id)
  const myStatus = myApplication?.status
  const alreadyApplied = myStatus === 'pending' || myStatus === 'accepted'

  const { data: userProfile } = user ? await supabase.from('profiles').select('is_guide').eq('id', user.id).single() : { data: null }
  const canApplyAsGuide = user && userProfile?.is_guide && !isOwner && effectiveStatus === 'open'

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}/guides/requests`} className="text-sm text-subtle hover:text-warning flex items-center gap-1">
            {tc('back')}
          </Link>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/${locale}/guides/requests/${id}/edit`}>
                <Button size="sm" variant="outline" className="rounded-full text-xs px-4 border-warning-border text-warning hover:bg-warning-light">
                  {tc('edit')}
                </Button>
              </Link>
              <DeleteGuideRequestButton requestId={id} locale={locale} />
            </div>
          )}
        </div>

        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          {request.cover_image ? (
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/7' }}>
              <SmartImage src={request.cover_image} alt="" width={1200} height={525} sizes="100vw" priority className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-end justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{destCountry?.emoji || '🌍'}</span>
                    <div>
                      <h1 className="text-2xl font-bold drop-shadow">{destCountry?.name || request.destination_country}</h1>
                      {request.destination_city && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {request.destination_city.split(', ').map((c: string) => (
                            <span key={c} className="bg-surface/20 text-white text-xs px-2.5 py-1 rounded-full">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${
                    effectiveStatus === 'open' ? 'bg-success-muted text-success-strong' : effectiveStatus === 'ended' ? 'bg-sunset-strong text-white' : 'bg-subtle text-white'
                  }`}>
                    {effectiveStatus === 'open' ? 'OPEN' : effectiveStatus === 'ended' ? 'ENDED' : 'CLOSED'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm mt-2">
                  <span suppressHydrationWarning className="bg-surface/20 px-3 py-1 rounded-full">
                    {startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="bg-surface/20 px-3 py-1 rounded-full">{nights}N {nights + 1}D</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-warning-strong to-sunset-strong p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{destCountry?.emoji || '🌍'}</span>
                <div>
                  <h1 className="text-2xl font-bold">{destCountry?.name || request.destination_country}</h1>
                  {request.destination_city && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {request.destination_city.split(', ').map((c: string) => (
                        <span key={c} className="bg-surface/20 text-white text-xs px-2.5 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
                  effectiveStatus === 'open' ? 'bg-success-muted text-success-strong' : effectiveStatus === 'ended' ? 'bg-sunset-strong text-white' : 'bg-subtle text-white'
                }`}>
                  {effectiveStatus === 'open' ? 'OPEN' : effectiveStatus === 'ended' ? 'ENDED' : 'CLOSED'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span suppressHydrationWarning className="bg-surface/20 px-3 py-1 rounded-full">
                  {startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="bg-surface/20 px-3 py-1 rounded-full">{nights}N {nights + 1}D</span>
              </div>
            </div>
          )}

          <div className="p-6 space-y-5">
            <TranslatedText
              text={request.title as string}
              locale={locale}
              as="h2"
              className="text-xl font-bold text-heading"
            />

            {/* 선호 언어 */}
            {request.preferred_languages && (request.preferred_languages as string[]).length > 0 && (
              <div className="bg-purple-light border border-purple-muted rounded-xl p-4">
                <div className="text-xs font-semibold text-purple-strong mb-2">🗣️ {t('preferredLangsTitle')}</div>
                <div className="flex flex-wrap gap-2">
                  {(request.preferred_languages as string[]).map(code => {
                    const lang = getLanguageByCode(code)
                    return lang ? (
                      <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-purple-border text-purple-strong rounded-full text-sm font-medium">
                        {lang.emoji} {lang.name}
                      </span>
                    ) : null
                  })}
                </div>
                <p className="text-xs text-purple mt-2">
                  {t('langNotificationHint')}
                </p>
              </div>
            )}

            {request.description && (
              <div className="bg-surface-sunken rounded-xl p-4 text-body text-sm leading-relaxed whitespace-pre-wrap">
                <TranslatedText
                  text={request.description as string}
                  locale={locale}
                  as="div"
                  className="whitespace-pre-wrap"
                />
              </div>
            )}

            {canApplyAsGuide && (
              <div className="border-t border-edge pt-5">
                {!user ? (
                  <div className="text-center py-4">
                    <p className="text-subtle text-sm mb-3">{t('loginToApply')}</p>
                    <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/guides/requests/${id}`)}`}>
                      <Button className="bg-warning-strong hover:bg-warning rounded-full px-8 text-white">{tc('login')}</Button>
                    </Link>
                  </div>
                ) : (
                  <ApplyAsGuideButton requestId={id} alreadyApplied={alreadyApplied} />
                )}
              </div>
            )}

            {!user && effectiveStatus === 'open' && (
              <div className="text-center py-4 border-t border-edge">
                <p className="text-subtle text-sm mb-3">{t('registerAsGuide')}</p>
                <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/guides/requests/${id}`)}`}>
                  <Button className="bg-warning-strong hover:bg-warning rounded-full px-8 text-white">{tc('login')}</Button>
                </Link>
              </div>
            )}
            {user && !isOwner && effectiveStatus === 'open' && !userProfile?.is_guide && (
              <div className="text-center py-4 border-t border-edge">
                <p className="text-subtle text-sm mb-3">{t('registerAsGuide')}</p>
                <Link href={`/${locale}/profile/edit`}>
                  <Button variant="outline" className="rounded-full px-6 border-warning-border text-warning hover:bg-warning-light">{t('profileOrRegisterGuide')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-heading mb-4">{t('postedBy')}</h3>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/users/${author?.id}`} className="w-14 h-14 rounded-full bg-warning-muted flex items-center justify-center shrink-0 overflow-hidden">
              {(author?.avatar_url as string) ? (
                <Avatar src={author.avatar_url as string} size={56} fill />
              ) : <span className="text-warning text-xl">?</span>}
            </Link>
            <div>
              <Link href={`/${locale}/users/${author?.id}`} className="font-bold text-heading hover:text-warning">
                {(author?.full_name as string) || 'Traveler'}
              </Link>
              {user && !isOwner && (
                <div className="mt-2">
                  <Link href={`/${locale}/messages/${author?.id}`}>
                    <Button size="sm" className="bg-warning-strong hover:bg-warning text-white rounded-full text-xs">
                      {tc('message')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {isOwner && applications && (
          <GuideApplicationsList applications={applications} requestId={id} locale={locale} />
        )}
      </main>
    </div>
  )
}
