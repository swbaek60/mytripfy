import { createClient, createAdminClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
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
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const { data: post } = await admin.from('companion_posts').select('title, description, country_code, start_date').eq('id', id).single()
  if (!post) return { title: 'Trip Not Found' }
  const country = getCountryByCode(post.country_code)
  return {
    title: `${post.title} – ${country?.name || post.country_code}`,
    description: post.description?.slice(0, 160) || `Join this trip to ${country?.name || post.country_code} on mytripfy.`,
    openGraph: {
      title: `${post.title} | mytripfy`,
      description: post.description?.slice(0, 160) || `Find travel companions for ${country?.name || post.country_code}.`,
    },
  }
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('companion_posts')
    .select(`*, group_chat_id, profiles (id, full_name, avatar_url, travel_level, trust_score, review_count, nationality, bio, is_guide, email_verified, phone_verified, sns_verified)`)
    .eq('id', id)
    .single()

  if (!post) notFound()

  const profile = post.profiles as Record<string, unknown>
  const isOwner = user?.id === profile?.id

  // 신청자 성별 체크: 여성만/남성만 게시글은 프로필 성별이 일치할 때만 신청 가능
  const { data: myProfile } = user
    ? await supabase.from('profiles').select('gender').eq('id', user.id).single()
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

  const itineraryDays = (daysRaw ?? []).map((d: any) => ({
    ...d,
    trip_activities: (d.trip_activities ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }))

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
      <Header user={user} locale={locale} currentPath="/companions" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back + 수정 버튼 */}
        <div className="flex items-center justify-between">
          <Link href={`/${locale}/companions`} className="text-sm text-subtle hover:text-brand flex items-center gap-1">
            ← Back to listings
          </Link>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/${locale}/companions/${post.id}/edit`}>
                <Button size="sm" variant="outline" className="rounded-full text-xs border-edge-brand text-brand hover:bg-brand-light">
                  ✏️ 수정
                </Button>
              </Link>
              <DeleteCompanionPostButton postId={post.id} locale={locale} />
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          {/* Header Banner */}
          {post.cover_image ? (
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/7' }}>
              <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-end justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                      <CountryFlag code={post.destination_country} size="lg" />
                    </span>
                    <div>
                      <h1 className="text-2xl font-bold drop-shadow">{destCountry?.name || post.destination_country}</h1>
                      {post.destination_city && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {post.destination_city.split(', ').map((c: string) => (
                            <span key={c} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {effectiveStatus === 'open' ? (
                    <span className="shrink-0 bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full">OPEN</span>
                  ) : effectiveStatus === 'ended' ? (
                    <span className="shrink-0 bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">ENDED</span>
                  ) : (
                    <span className="shrink-0 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">CLOSED</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-sm mt-2">
                  <span suppressHydrationWarning className="bg-white/20 px-3 py-1 rounded-full">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">{nights}N {nights + 1}D</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">{post.max_people} people</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <span className="drop-shadow">
                  <CountryFlag code={post.destination_country} size="lg" />
                </span>
                <div>
                  <h1 className="text-2xl font-bold">{destCountry?.name || post.destination_country}</h1>
                  {post.destination_city && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {post.destination_city.split(', ').map((c: string) => (
                        <span key={c} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                {effectiveStatus === 'open' ? (
                  <span className="ml-auto bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full">OPEN</span>
                ) : effectiveStatus === 'ended' ? (
                  <span className="ml-auto bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">ENDED</span>
                ) : (
                  <span className="ml-auto bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">CLOSED</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span suppressHydrationWarning className="bg-white/20 px-3 py-1 rounded-full">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">{nights}N {nights + 1}D</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">{post.max_people} people</span>
              </div>
            </div>
          )}

          <div className="p-6 space-y-5">
            {/* Title */}
            <h2 className="text-xl font-bold text-heading">{post.title}</h2>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {post.purpose && (
                <span className="text-sm bg-brand-light text-brand-hover px-3 py-1.5 rounded-full font-medium">
                  {PURPOSE_LABELS[post.purpose] || post.purpose}
                </span>
              )}
              <span className="text-sm bg-purple-light text-purple-700 px-3 py-1.5 rounded-full font-medium">
                {post.gender_preference === 'male_only' ? 'Male only'
                  : post.gender_preference === 'female_only' ? 'Female only'
                  : 'Anyone welcome'}
              </span>
            </div>

            {/* Description */}
            {post.description && (
              <div className="bg-surface-sunken rounded-xl p-4 text-body text-sm leading-relaxed whitespace-pre-wrap">
                {post.description}
              </div>
            )}

            {/* Apply Section */}
            {!isOwner && effectiveStatus === 'open' && (
              <div className="border-t border-edge pt-5">
                {!user ? (
                  <div className="text-center py-4">
                    <p className="text-subtle text-sm mb-3">Login to apply for this trip</p>
                    <Link href={`/${locale}/login`}>
                      <Button className="bg-brand hover:bg-brand-hover rounded-full px-8">Login to Apply</Button>
                    </Link>
                  </div>
                ) : !canApplyByGender ? (
                  <div className="bg-amber-light border border-amber-200 rounded-xl p-4">
                    {pref === 'female_only' && (
                      <>
                        <p className="text-amber-800 font-medium text-sm">👩 This trip is for women only.</p>
                        <p className="text-amber-700 text-xs mt-1">
                          {myGender === 'male'
                            ? 'Only users with Female in their profile can apply.'
                            : 'Please set your gender to Female in Profile to apply.'}
                        </p>
                      </>
                    )}
                    {pref === 'male_only' && (
                      <>
                        <p className="text-amber-800 font-medium text-sm">👨 This trip is for men only.</p>
                        <p className="text-amber-700 text-xs mt-1">
                          {myGender === 'female'
                            ? 'Only users with Male in their profile can apply.'
                            : 'Please set your gender to Male in Profile to apply.'}
                        </p>
                      </>
                    )}
                    <Link href={`/${locale}/profile/edit`} className="inline-block mt-2 text-xs text-amber-700 underline hover:text-amber-900">
                      Edit profile
                    </Link>
                  </div>
                ) : wasRemoved ? (
                  /* 강제 제거된 경우: 재신청 안내 */
                  <div className="space-y-3">
                    <div className="bg-danger-light border border-red-200 rounded-xl p-4">
                      <p className="text-red-700 font-medium text-sm">🚫 You were removed from this trip by the host.</p>
                      <p className="text-danger text-xs mt-1">You can re-apply if you wish to join again.</p>
                    </div>
                    <ApplyButton
                      postId={post.id}
                      userId={user.id}
                      locale={locale}
                      alreadyApplied={false}
                      wasRemoved={true}
                    />
                  </div>
                ) : isFull ? (
                  <div className="text-center py-4 text-subtle">
                    <p>This trip is already full.</p>
                  </div>
                ) : (
                  <ApplyButton
                    postId={post.id}
                    userId={user.id}
                    locale={locale}
                    alreadyApplied={alreadyApplied || false}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Host Profile */}
        <div className="bg-surface rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-heading mb-4">Posted by</h3>
          <div className="flex items-start gap-4">
            <Link href={`/${locale}/users/${profile?.id}`} className="w-14 h-14 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity overflow-hidden">
              {(profile?.avatar_url as string) ? (
                <img src={profile.avatar_url as string} alt="" className="w-full h-full object-cover" />
              ) : <span className="text-hint text-xl">?</span>}
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/${locale}/users/${profile?.id}`} className="font-bold text-heading hover:text-brand">
                  {(profile?.full_name as string) || 'Anonymous'}
                </Link>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
                  {levelInfo.badge} Lv.{levelInfo.level}
                </span>
              </div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {(profile?.email_verified as boolean) && <span className="text-xs bg-success-light text-success px-2 py-0.5 rounded-full border border-green-200">Email verified</span>}
                {(profile?.phone_verified as boolean) && <span className="text-xs bg-brand-light text-brand-hover px-2 py-0.5 rounded-full border border-edge-brand">Phone verified</span>}
                {(profile?.sns_verified as boolean) && <span className="text-xs bg-purple-light text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">SNS verified</span>}
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-subtle">
                {(profile?.trust_score as number) > 0 && (
                  <span>★ {Number(profile.trust_score).toFixed(1)} ({profile?.review_count as number} reviews)</span>
                )}
              </div>
              {(profile?.bio as string) && (
                <p className="text-sm text-body mt-2 line-clamp-2">{profile.bio as string}</p>
              )}
              {/* Action buttons */}
              {user && !isOwner && (
                <div className="flex gap-2 mt-3">
                  <Link href={`/${locale}/messages/${profile?.id}?postId=${post.id}`}>
                    <Button size="sm" className="bg-brand hover:bg-brand-hover text-white rounded-full text-xs px-4">
                      Message
                    </Button>
                  </Link>
                  <Link href={`/${locale}/reviews/write?userId=${profile?.id}`}>
                    <Button size="sm" variant="outline" className="rounded-full text-xs border-yellow-300 text-warning hover:bg-warning-light">
                      Write Review
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Day-by-Day Itinerary */}
        <div className="bg-surface rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-heading">Trip Itinerary</h3>
              <p className="text-xs text-hint mt-0.5">
                {itineraryDays.length > 0
                  ? `${itineraryDays.length} day${itineraryDays.length > 1 ? 's' : ''} · ${itineraryDays.flatMap((d: any) => d.trip_activities).length} activities`
                  : isOwner ? 'Add your day-by-day plan to attract companions' : 'No detailed itinerary yet'}
              </p>
            </div>
          </div>
          {isOwner ? (
            <ItineraryEditor
              postId={post.id}
              startDate={post.start_date}
              initialDays={itineraryDays}
            />
          ) : (
            <ItineraryView days={itineraryDays} />
          )}
        </div>

        {/* 동행자 리스트: 호스트 + 수락된 멤버 (호스트와 수락된 멤버만 볼 수 있음) */}
        {(isOwner || isAccepted) && applications && (
          <TripMembersCard
            locale={locale}
            host={{
              id: profile?.id as string,
              full_name: profile?.full_name as string | null,
              avatar_url: profile?.avatar_url as string | null,
              travel_level: profile?.travel_level as number | undefined,
              isHost: true,
            }}
            acceptedMembers={applications
              .filter(a => a.status === 'accepted')
              .map(a => {
                const p = a.profiles as Record<string, unknown>
                return {
                  id: a.applicant_id,
                  full_name: p?.full_name as string | null,
                  avatar_url: p?.avatar_url as string | null,
                  travel_level: p?.travel_level as number | undefined,
                }
              })}
            groupChatId={groupChatId}
          />
        )}

        {/* Applications (owner only) */}
        {isOwner && applications && (
          <ApplicationsList
            applications={applications}
            postId={post.id}
            postTitle={post.title}
            groupChatId={groupChatId}
            locale={locale}
          />
        )}

        {/* 수락된 멤버 전용: 1명이면 DM, 3명 이상 수락이면 그룹 채팅 */}
        {!isOwner && isAccepted && (
          <div className="bg-brand-light border border-edge-brand rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-blue-800 text-sm">You&apos;re in the trip!</p>
              {acceptedCount >= 2 && groupChatId ? (
                <p className="text-xs text-brand mt-0.5">Join the group chat to coordinate with your travel group.</p>
              ) : (
                <p className="text-xs text-brand mt-0.5">DM the host to coordinate your trip.</p>
              )}
            </div>
            {acceptedCount >= 2 && groupChatId ? (
              <Link href={`/${locale}/messages/group/${groupChatId}`}>
                <Button className="bg-brand hover:bg-brand-hover text-white rounded-full text-sm px-5 shrink-0 flex items-center gap-2">
                  <span>💬</span> Trip Group Chat
                </Button>
              </Link>
            ) : (
              <Link href={`/${locale}/messages/${profile?.id}?postId=${post.id}`}>
                <Button className="bg-brand hover:bg-brand-hover text-white rounded-full text-sm px-5 shrink-0 flex items-center gap-2">
                  <span>💬</span> DM Host
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Application count (non-owner, non-accepted) */}
        {!isOwner && !isAccepted && applications && applications.length > 0 && (
          <div className="bg-surface rounded-2xl shadow-sm p-4 text-center text-sm text-subtle">
            {acceptedCount} accepted · {applications.length} total applicants
          </div>
        )}

        {/* Trip Q&A (공개 질문 섹션) */}
        <QuestionsSection
          postId={post.id}
          postTitle={post.title}
          locale={locale}
          currentUserId={user?.id || null}
          hostId={profile?.id as string}
          hostName={(profile?.full_name as string) || 'Host'}
          initialQuestions={(qnaRows || []).map(row => ({
            id: row.id as string,
            question: row.question_content as string,
            question_created_at: row.question_created_at as string,
            question_user_id: row.question_user_id as string,
            question_user_name:
              questionNameMap.get(row.question_user_id as string) ||
              'Traveler',
            answer: (row.answer_content as string | null) ?? null,
            answer_created_at: row.answer_created_at as string | null,
          }))}
        />
      </main>
    </div>
  )
}
