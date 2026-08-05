import { createClient, createAdminClient, getAuthUser, getAdminClientSafe } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import { getCountryByCode, getLevelInfo } from '@/data/countries'
import { Button } from '@/components/ui/button'
import CountryFlag from '@/components/CountryFlag'
import Link from 'next/link'
import ApplyButton from './ApplyButton'
import ApplicationsList from './ApplicationsList'
import TripMembersCard from './TripMembersCard'
import QuestionsSection from './QuestionsSection'
import DeleteCompanionPostButton from './DeleteCompanionPostButton'
import ItineraryEditor from '@/components/ItineraryEditor'
import ItineraryView from '@/components/ItineraryView'
import CompanionPosterCarousel from '@/components/CompanionPosterCarousel'
import TranslatedText from '@/components/TranslatedText'
import TrackRecentCompanion from '@/components/explore/TrackRecentCompanion'
import CompanionStickyCta from '@/components/explore/CompanionStickyCta'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { normalizeItineraryDays } from '@/types/itinerary'
import Avatar from '@/components/ui/Avatar'
import SmartImage from '@/components/ui/SmartImage'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd, buildCompanionEventJsonLd } from '@/lib/seo/json-ld'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params
  const admin = getAdminClientSafe()
  if (!admin) return { title: 'Trip | mytripfy' }
  const { data: post } = await admin.from('companion_posts').select('title, description, destination_country, start_date').eq('id', id).single()
  if (!post) return { title: 'Trip Not Found' }
  const country = getCountryByCode(post.destination_country)
  const place = country?.name || post.destination_country
  const desc =
    post.description?.slice(0, 160) || `Join this trip to ${place} on mytripfy.`
  return buildPageMetadata({
    locale,
    path: `/companions/${id}`,
    title: `${post.title} – ${place}`,
    description: desc,
    openGraphType: 'article',
    keywords: ['travel companion', place, post.destination_country, 'mytripfy'],
  })
}

export const dynamic = 'force-dynamic'

const PURPOSE_LABELS: Record<string, string> = {
  tourism: 'Tourism', backpacking: 'Backpacking',
  business: 'Business', food: 'Food Tour',
  adventure: 'Adventure', culture: 'Culture',
  photography: 'Photography', volunteer: 'Volunteer', other: 'Other',
}

export default async function CompanionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'CompanionDetail' })
  const tc = await getTranslations({ locale, namespace: 'Common' })
  const tNav = await getTranslations({ locale, namespace: 'Nav' })
  const supabase = await createClient()
  // Clerk auth()를 직접 사용 - shim 실패 방지
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  const { data: post } = await supabase
    .from('companion_posts')
    .select(`*, group_chat_id, profiles (id, full_name, avatar_url, profile_photos, travel_level, trust_score, review_count, nationality, bio, is_guide, email_verified, phone_verified, sns_verified)`)
    .eq('id', id)
    .single()

  if (!post) notFound()

  const profile = post.profiles as Record<string, unknown>
  const isOwner = user?.id === profile?.id

  // 신청자 성별 체크: 여성만/남성만 게시글은 프로필 성별이 일치할 때만 신청 가능
  const admin = createAdminClient()
  const { data: myProfile } = user
    ? await admin.from('profiles').select('gender').eq('id', user.id).single()
    : { data: null }
  const myGender = (myProfile?.gender as string) || ''
  const pref = post.gender_preference as string
  const canApplyByGender =
    pref === 'any' ||
    (pref === 'female_only' && myGender === 'female') ||
    (pref === 'male_only' && myGender === 'male')

  // 호스트는 RLS 우회로 신청 목록 조회 (RLS 이슈 시 빈 목록 방지)
  const applicationsClient = isOwner ? createAdminClient() : supabase
  const { data: applications } = await applicationsClient
    .from('companion_applications')
    .select(`*, profiles (id, full_name, avatar_url, travel_level, trust_score, nationality)`)
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  const destCountry = getCountryByCode(post.destination_country)
  const levelInfo = getLevelInfo((profile?.travel_level as number) || 1)

  // Trip Q&A 질문/답변 불러오기
  const { data: qnaRows } = await supabase
    .from('companion_questions')
    .select('id, question_user_id, question_content, question_created_at, answer_user_id, answer_content, answer_created_at')
    .eq('post_id', id)
    .order('question_created_at', { ascending: true })

  // 질문자 이름 매핑
  const questionUserIds = Array.from(
    new Set((qnaRows || []).map(row => row.question_user_id as string))
  )
  const { data: questionProfiles } = questionUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', questionUserIds)
    : { data: [] as { id: string; full_name: string | null }[] }

  const questionNameMap = new Map<string, string | null>(
    (questionProfiles || []).map(p => [p.id, p.full_name])
  )

  // 일정표 데이터 fetch
  const { data: daysRaw } = await supabase
    .from('trip_days')
    .select('*, trip_activities(*)')
    .eq('post_id', id)
    .order('day_number', { ascending: true })

  const itineraryDays = normalizeItineraryDays(daysRaw)

  const startDate = new Date(post.start_date)
  const endDate = new Date(post.end_date)
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  // 종료일이 오늘보다 이전이면 자동 만료
  const isExpired = endDate < new Date(new Date().toDateString())
  const effectiveStatus = isExpired ? 'ended' : post.status  // 'open' | 'closed' | 'ended'

  const myApplication = applications?.find(a => a.applicant_id === user?.id)
  const myStatus = myApplication?.status  // pending | accepted | rejected | removed | undefined
  const isAccepted = myStatus === 'accepted'
  const wasRemoved = myStatus === 'removed'
  // 이미 신청한 것으로 간주: pending 또는 accepted 상태만 (removed/rejected는 재신청 허용)
  const alreadyApplied = myStatus === 'pending' || myStatus === 'accepted'
  const acceptedCount = applications?.filter(a => a.status === 'accepted').length || 0
  const isFull = acceptedCount >= post.max_people - 1
  const totalMembers = 1 + acceptedCount // host + 수락된 멤버
  let groupChatId = post.group_chat_id ?? null

  // 3명 이상인데 그룹 채팅방이 없으면 생성 (호스트/수락 멤버만 볼 때, 기존 글 보정)
  if ((isOwner || isAccepted) && totalMembers >= 3 && !groupChatId && applications) {
    const admin = createAdminClient()
    const hostId = profile?.id as string
    const { data: newChat } = await admin
      .from('chats')
      .insert({
        type: 'trip_group',
        is_group: true,
        name: post.title,
        reference_id: id,
        created_by: hostId,
      })
      .select('id')
      .single()
    if (newChat?.id) {
      const acceptedUserIds = applications.filter(a => a.status === 'accepted').map(a => a.applicant_id)
      const participantRows = [{ chat_id: newChat.id, user_id: hostId }, ...acceptedUserIds.map(uid => ({ chat_id: newChat.id, user_id: uid }))]
      await admin.from('chat_participants').upsert(participantRows, { onConflict: 'chat_id,user_id' })
      await admin.from('companion_posts').update({ group_chat_id: newChat.id }).eq('id', id)
      groupChatId = newChat.id
    }
  }

  return (
    <div className="min-h-screen bg-surface-sunken">
      <JsonLdScript
        data={buildCompanionEventJsonLd({
          locale,
          postId: id,
          name: post.title,
          description: post.description,
          startDate: post.start_date,
          endDate: post.end_date,
          locationName: (post.destination_cities as string[] | null)?.[0] ?? destCountry?.name ?? null,
          countryCode: post.destination_country,
          image: (post.cover_image_url as string | null) ?? null,
          organizerName: (profile?.full_name as string | null) ?? null,
          isOpen: effectiveStatus === 'open',
        })}
      />
      <JsonLdScript
        data={buildBreadcrumbJsonLd(locale, [
          { name: tNav('findCompanions'), path: '/companions' },
          { name: post.title, path: `/companions/${id}` },
        ])}
      />
      <Header locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back + 수정 버튼 */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/${locale}/companions`} className="text-sm text-subtle hover:text-brand flex items-center gap-1">
            {tc('back')}
          </Link>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/${locale}/companions/${post.id}/edit`}>
                <Button size="sm" variant="outline" className="rounded-full text-xs border-edge-brand text-brand hover:bg-brand-light">
                  {tc('edit')}
                </Button>
              </Link>
              <DeleteCompanionPostButton postId={post.id} locale={locale} />
            </div>
          )}
        </div>

        {/* 2열 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── 왼쪽: 여행 정보 + 일정 + Q&A ── */}
        <div className="lg:col-span-2 space-y-6">

        {/* Main Card */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          {/* Split Header: Left = Poster profile, Right = Cover photo or flag */}
          <div className="flex h-56 sm:h-64 overflow-hidden">
            {/* Left — Poster profile photo (carousel if multiple) */}
            <div className="w-1/2 relative bg-gradient-to-br from-surface-hover to-edge overflow-hidden border-r border-white/30">
              <CompanionPosterCarousel
                avatarUrl={(profile?.avatar_url as string) || null}
                photos={(profile?.profile_photos as string[] | null) ?? []}
                name={(profile?.full_name as string) || 'Anonymous'}
                levelBadge={levelInfo.badge}
                levelNum={levelInfo.level}
              />
            </div>

            {/* Right — Trip cover image or flag */}
            <div className="w-1/2 relative overflow-hidden">
              {post.cover_image ? (
                <>
                  <SmartImage src={post.cover_image} alt="" width={700} height={520} sizes="(max-width: 1024px) 50vw, 350px" priority className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand/80 to-indigo/90 flex flex-col items-center justify-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- flagcdn 은 요청한 크기로 바로 서빙한다. */}
                  <img
                    src={`https://flagcdn.com/160x120/${post.destination_country.toLowerCase()}.png`}
                    srcSet={`https://flagcdn.com/320x240/${post.destination_country.toLowerCase()}.png 2x`}
                    width={160}
                    height={120}
                    alt={post.destination_country}
                    className="rounded-xl shadow-2xl object-cover"
                  />
                  <span className="text-white font-bold text-base">
                    {destCountry?.name || post.destination_country}
                  </span>
                </div>
              )}
              {/* Status badge */}
              <div className="absolute top-3 right-3">
                {effectiveStatus === 'open' ? (
                  <span className="bg-success-muted text-success-strong text-xs font-bold px-3 py-1 rounded-full shadow">{t('open')}</span>
                ) : effectiveStatus === 'ended' ? (
                  <span className="bg-sunset-strong text-white text-xs font-bold px-3 py-1 rounded-full shadow">{t('ended')}</span>
                ) : (
                  <span className="bg-subtle text-white text-xs font-bold px-3 py-1 rounded-full shadow">{t('closed')}</span>
                )}
              </div>
              {/* Country + city overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                <div className="flex items-center gap-2">
                  <CountryFlag code={post.destination_country} size="md" />
                  <div>
                    <h1 className="text-white font-bold text-base leading-tight">{destCountry?.name || post.destination_country}</h1>
                    {post.destination_city && (
                      <p className="text-white/80 text-xs truncate">{post.destination_city}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trip meta info bar */}
          <div className="bg-surface-sunken px-5 py-3 flex flex-wrap gap-2 border-b border-edge/50">
            <span suppressHydrationWarning className="text-xs bg-surface text-body px-3 py-1 rounded-full border border-edge/60">
              📅 {startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs bg-surface text-body px-3 py-1 rounded-full border border-edge/60">
              🌙 {nights}N {nights + 1}D
            </span>
            <span className="text-xs bg-surface text-body px-3 py-1 rounded-full border border-edge/60">
              👥 {post.max_people} people
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Title */}
            <TranslatedText
              text={post.title}
              locale={locale}
              as="h2"
              className="text-xl font-bold text-heading"
            />

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {post.purpose && (
                <span className="text-sm bg-brand-light text-brand-hover px-3 py-1.5 rounded-full font-medium">
                  {PURPOSE_LABELS[post.purpose] || post.purpose}
                </span>
              )}
              <span className="text-sm bg-purple-light text-purple-strong px-3 py-1.5 rounded-full font-medium">
                {post.gender_preference === 'male_only' ? 'Male only'
                  : post.gender_preference === 'female_only' ? 'Female only'
                  : 'Anyone welcome'}
              </span>
            </div>

            {/* Description */}
            {post.description && (
              <div className="bg-surface-sunken rounded-xl p-4 text-body text-sm leading-relaxed whitespace-pre-wrap">
                <TranslatedText
                  text={post.description}
                  locale={locale}
                  as="div"
                  className="whitespace-pre-wrap"
                />
              </div>
            )}

          </div>
        </div>

        {/* 일정 */}
        <div className="bg-surface rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-heading">{t('tripItinerary')}</h3>
              <p className="text-xs text-hint mt-0.5">
                {itineraryDays.length > 0
                  ? `${itineraryDays.length} day${itineraryDays.length > 1 ? 's' : ''} · ${itineraryDays.flatMap((d) => d.trip_activities).length} activities`
                  : isOwner ? t('itineraryOwnerHint') : t('itineraryEmptyHint')}
              </p>
            </div>
          </div>
          {isOwner ? (
            <ItineraryEditor postId={post.id} startDate={post.start_date} initialDays={itineraryDays} />
          ) : (
            <ItineraryView days={itineraryDays} />
          )}
        </div>

        {/* Q&A */}
        <QuestionsSection
          postId={post.id}
          locale={locale}
          currentUserId={user?.id || null}
          hostId={profile?.id as string}
          hostName={(profile?.full_name as string) || 'Host'}
          initialQuestions={(qnaRows || []).map(row => ({
            id: row.id as string,
            question: row.question_content as string,
            question_created_at: row.question_created_at as string,
            question_user_id: row.question_user_id as string,
            question_user_name: questionNameMap.get(row.question_user_id as string) || 'Traveler',
            answer: (row.answer_content as string | null) ?? null,
            answer_created_at: row.answer_created_at as string | null,
          }))}
        />
        </div>{/* 왼쪽 끝 */}

        {/* ── 오른쪽 사이드바 (sticky) ── */}
        <div className="space-y-4 lg:sticky lg:top-20">

          {/* Apply 카드 */}
          {!isOwner && effectiveStatus === 'open' && (
            <div className="bg-surface rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 text-sm text-subtle mb-3">
                <span>{acceptedCount} accepted</span>
                <span>·</span>
                <span>{(applications?.length ?? 0)} total</span>
                <span className="ml-auto bg-success-light text-success-strong text-xs font-bold px-2 py-0.5 rounded-full">{t('open')}</span>
              </div>
              {!user ? (
                <div className="text-center py-2">
                  <p className="text-subtle text-sm mb-3">{t('loginToApplyTrip')}</p>
                  <Link href={`/${locale}/login?returnTo=/${locale}/companions/${id}`} className="block">
                    <Button className="w-full bg-brand hover:bg-brand-hover rounded-xl py-5 text-base font-bold">{t('loginToApply')}</Button>
                  </Link>
                </div>
              ) : !canApplyByGender ? (
                <div className="bg-warning-light border border-warning-border rounded-xl p-4 text-sm">
                  {pref === 'female_only' && <p className="text-warning-strong font-medium">👩 {t('womenOnlyNotice')}</p>}
                  {pref === 'male_only' && <p className="text-warning-strong font-medium">👨 {t('menOnlyNotice')}</p>}
                  <Link href={`/${locale}/profile/edit`} className="inline-block mt-2 text-xs text-warning-strong underline">{t('editProfileFirst')}</Link>
                </div>
              ) : wasRemoved ? (
                <div className="space-y-3">
                  <div className="bg-danger-light border border-danger-border rounded-xl p-3 text-sm text-danger-strong">🚫 {t('removedFromTrip')}</div>
                  <ApplyButton postId={post.id} alreadyApplied={false} />
                </div>
              ) : isFull ? (
                <p className="text-center text-subtle text-sm py-3">{t('tripFull')}</p>
              ) : (
                <ApplyButton postId={post.id} alreadyApplied={alreadyApplied || false} />
              )}
            </div>
          )}

          {/* 수락된 멤버 채팅 */}
          {!isOwner && isAccepted && (
            <div className="bg-brand-light border border-edge-brand rounded-2xl p-5">
              <p className="font-bold text-brand-strong text-sm mb-1">{t('youreIn')}</p>
              <p className="text-xs text-brand mb-3">
                {acceptedCount >= 2 && groupChatId ? t('joinGroupChatHint') : t('dmHostHint')}
              </p>
              {acceptedCount >= 2 && groupChatId ? (
                <Link href={`/${locale}/messages/group/${groupChatId}`}>
                  <Button className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl">💬 {t('tripGroupChat')}</Button>
                </Link>
              ) : (
                <Link href={`/${locale}/messages/${profile?.id}?postId=${post.id}`}>
                  <Button className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl">💬 {t('dmHost')}</Button>
                </Link>
              )}
            </div>
          )}

          {/* Host Profile */}
          <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5">
              <h3 className="font-bold text-heading mb-4 text-sm">{t('postedBy')}</h3>
              <div className="flex items-start gap-3">
                <Link href={`/${locale}/users/${profile?.id}`} className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity overflow-hidden">
                  {(profile?.avatar_url as string) ? (
                    <Avatar src={profile.avatar_url as string} size={48} fill />
                  ) : <span className="text-hint text-lg">?</span>}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/${locale}/users/${profile?.id}`} className="font-bold text-heading hover:text-brand text-sm">
                      {(profile?.full_name as string) || tc('anonymous')}
                    </Link>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
                      {levelInfo.badge} Lv.{levelInfo.level}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(profile?.email_verified as boolean) && <span className="text-xs bg-success-light text-success-strong px-1.5 py-0.5 rounded-full">✓ Email</span>}
                    {(profile?.phone_verified as boolean) && <span className="text-xs bg-brand-light text-brand-strong px-1.5 py-0.5 rounded-full">✓ Phone</span>}
                  </div>
                  {(profile?.trust_score as number) > 0 && (
                    <p className="text-xs text-subtle mt-1">★ {Number(profile.trust_score).toFixed(1)} ({profile?.review_count as number} reviews)</p>
                  )}
                  {(profile?.bio as string) && (
                    <TranslatedText
                      text={profile.bio as string}
                      locale={locale}
                      as="p"
                      className="text-xs text-body mt-1.5 line-clamp-2"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Message CTA — 눈에 띄는 큰 버튼 */}
            {user && !isOwner && (
              <div className="px-5 pb-5 space-y-2">
                <Link href={`/${locale}/messages/${profile?.id}?postId=${post.id}`} className="block">
                  <Button className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl py-5 text-base font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {t('message')}
                  </Button>
                </Link>
                <Link href={`/${locale}/reviews/write?userId=${profile?.id}`} className="block">
                  <Button variant="outline" className="w-full rounded-xl py-5 text-base border-gold-border text-warning hover:bg-warning-light font-bold">
                    ★ {t('review')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* 동행자 멤버 */}
          {(isOwner || isAccepted) && applications && (
            <TripMembersCard
              locale={locale}
              host={{ id: profile?.id as string, full_name: profile?.full_name as string | null, avatar_url: profile?.avatar_url as string | null, travel_level: profile?.travel_level as number | undefined, isHost: true }}
              acceptedMembers={applications.filter(a => a.status === 'accepted').map(a => {
                const p = a.profiles as Record<string, unknown>
                return { id: a.applicant_id, full_name: p?.full_name as string | null, avatar_url: p?.avatar_url as string | null, travel_level: p?.travel_level as number | undefined }
              })}
              groupChatId={groupChatId}
            />
          )}

          {/* Applications (owner) */}
          {isOwner && applications && (
            <ApplicationsList applications={applications} postId={post.id} locale={locale} />
          )}

        </div>{/* 오른쪽 끝 */}
        </div>{/* grid 끝 */}
      </main>

      <TrackRecentCompanion id={post.id} title={post.title} country={post.destination_country} />
      {!isOwner && effectiveStatus === 'open' && (
        <CompanionStickyCta
          locale={locale}
          postId={post.id}
          alreadyApplied={!!alreadyApplied}
          isOwner={isOwner}
          isLoggedIn={!!user}
        />
      )}
    </div>
  )
}
