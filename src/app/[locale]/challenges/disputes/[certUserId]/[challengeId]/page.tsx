import { createClient, getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JuryClient from './JuryClient'
import Avatar from '@/components/ui/Avatar'
import SmartImage from '@/components/ui/SmartImage'
import { relationOne, type ChallengeRef, type ProfileRef } from '@/lib/db/relation'
import { getDisputeLabels } from '@/data/dispute-labels'
import { getTranslationsForChallenges } from '@/utils/challengeTranslations'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPrivateMetadata } from '@/lib/seo/private-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; certUserId: string; challengeId: string }>
}): Promise<Metadata> {
  const { locale, certUserId, challengeId } = await params
  return buildPrivateMetadata({
    locale,
    path: `/challenges/disputes/${certUserId}/${challengeId}`,
    namespace: 'SeoPages',
    titleKey: 'disputeTitle',
  })
}

export default async function DisputePage({
  params,
}: {
  params: Promise<{ locale: string; certUserId: string; challengeId: string }>
}) {
  const { locale, certUserId, challengeId } = await params
  const L = getDisputeLabels(locale)
  const td = await getTranslations({ locale, namespace: 'Dispute' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  // 인증 정보 조회
  const { data: cert } = await supabase
    .from('challenge_certifications')
    .select(`
      user_id, challenge_id, image_url, created_at, dispute_status,
      profiles(full_name, avatar_url),
      challenges(title_en, title_ko, category, points, country_code, description_en)
    `)
    .eq('user_id', certUserId)
    .eq('challenge_id', challengeId)
    .single()

  if (!cert) notFound()

  const challenge = relationOne<ChallengeRef>(cert.challenges)
  const translations = await getTranslationsForChallenges(supabase, [cert.challenge_id], locale)
  const tr = translations.get(cert.challenge_id)
  const challengeWithLocale = challenge ? {
    ...challenge,
    title: tr?.title ?? challenge.title_en,
    description: tr?.description ?? challenge.description_en ?? null,
  } : null

  // 딴지 목록
  const { data: disputesRaw } = await supabase
    .from('challenge_disputes')
    .select('id, reporter_id, reason, points_staked, status, created_at, profiles(full_name, avatar_url)')
    .eq('cert_user_id', certUserId)
    .eq('cert_challenge_id', challengeId)
    .order('created_at', { ascending: true })

  // 투표 현황
  const { data: votesRaw } = await supabase
    .from('dispute_votes')
    .select('voter_id, vote, created_at, profiles(full_name, avatar_url)')
    .eq('cert_user_id', certUserId)
    .eq('cert_challenge_id', challengeId)

  const disputes = (disputesRaw ?? []).map((d) => ({
    reporterId: d.reporter_id as string,
    reason: d.reason as string,
    createdAt: d.created_at as string,
    reporter: relationOne<ProfileRef>(d.profiles),
  }))

  const votes = (votesRaw ?? []).map((v) => ({
    voterId: v.voter_id as string,
    vote: v.vote as 'valid' | 'invalid',
    voter: relationOne<ProfileRef>(v.profiles),
  }))

  const validCount = votes.filter((v) => v.vote === 'valid').length
  const invalidCount = votes.filter((v) => v.vote === 'invalid').length

  // 내 투표 여부
  const myVote = user ? votes.find((v) => v.voterId === user.id)?.vote ?? null : null

  // 이해충돌 여부 (신고자 / 인증자)
  const isReporter = user ? disputes.some((d) => d.reporterId === user.id) : false
  const isCertOwner = user?.id === certUserId

  const canVote = user && !myVote && !isReporter && !isCertOwner && cert.dispute_status === 'reviewing'

  const profile = relationOne<ProfileRef>(cert.profiles)

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* 뒤로가기 */}
        <Link href={`/${locale}/challenges/feed`} className="text-sm text-subtle hover:text-purple">
          {td('backToFeed')}
        </Link>

        {/* 상태 배너 */}
        {cert.dispute_status === 'reviewing' && (
          <div className="bg-brand-light border-2 border-edge-brand rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <p className="font-bold text-heading">{td('verdictReviewingTitle')}</p>
              <p className="text-sm text-brand-hover mt-0.5">
                {td('statusReviewingBanner')}
              </p>
            </div>
          </div>
        )}
        {cert.dispute_status === 'invalidated' && (
          <div className="bg-danger-light border-2 border-danger-border rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-bold text-heading">{td('verdictInvalidTitle')}</p>
              <p className="text-sm text-danger mt-0.5">{td('statusInvalidBanner')}</p>
            </div>
          </div>
        )}
        {cert.dispute_status === 'clean' && (
          <div className="bg-success-light border-2 border-success-border rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-heading">{td('verdictValidTitle')}</p>
              <p className="text-sm text-success mt-0.5">{td('statusValidBanner')}</p>
            </div>
          </div>
        )}

        {/* 인증 정보 */}
        <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-edge">
          <div className="relative h-56">
            <SmartImage src={cert.image_url} alt={challengeWithLocale?.title ?? challenge?.title_en ?? ''} width={1280} height={448} sizes="(max-width: 1280px) 100vw, 1280px" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-5">
              <div className="text-white">
                <p className="text-lg font-extrabold">{challengeWithLocale?.title ?? challenge?.title_en}</p>
              </div>
              <div className="ml-auto bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                +{challenge?.points}pt
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                size={40}
                fallbackClassName="bg-gradient-to-br from-purple to-indigo text-white"
              />
              <div>
                <p className="font-bold text-heading">{profile?.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-hint">
                  {new Date(cert.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })} {td('certDate')}
                </p>
              </div>
            </div>
            {(challengeWithLocale?.description ?? challenge?.description_en) && (
              <p className="mt-3 text-xs text-subtle leading-relaxed line-clamp-3">
                {challengeWithLocale?.description ?? challenge?.description_en}
              </p>
            )}
          </div>
        </div>

        {/* 투표 현황 */}
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-edge">
          <h2 className="font-bold text-heading mb-4">⚖️ {td('juryVoteStatus')}</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-success-light rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-success">{validCount}</div>
              <div className="text-sm font-semibold text-success mt-1">✅ {td('validVotes')}</div>
            </div>
            <div className="bg-danger-light rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-danger">{invalidCount}</div>
              <div className="text-sm font-semibold text-danger mt-1">❌ {td('invalidVotes')}</div>
            </div>
          </div>

          {/* 프로그레스 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtle w-8">{td('valid')}</span>
              <div className="flex-1 bg-surface-sunken rounded-full h-2.5">
                <div className="bg-success h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, (validCount / 3) * 100)}%` }} />
              </div>
              <span className="text-xs text-hint">{validCount}/3</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtle w-8">{td('invalid')}</span>
              <div className="flex-1 bg-surface-sunken rounded-full h-2.5">
                <div className="bg-danger h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, (invalidCount / 3) * 100)}%` }} />
              </div>
              <span className="text-xs text-hint">{invalidCount}/3</span>
            </div>
          </div>

          {/* 배심원 투표 UI */}
          <JuryClient
            certUserId={certUserId}
            challengeId={challengeId}
            locale={locale}
            canVote={!!canVote}
            myVote={myVote}
            isReporter={isReporter}
            isCertOwner={isCertOwner}
            currentUserId={user?.id ?? null}
            labels={L}
          />

          {/* 투표자 목록 */}
          {votes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-edge">
              <p className="text-xs font-semibold text-subtle mb-2">{td('juryVoteHistory')}</p>
              <div className="space-y-2">
                {votes.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Avatar src={v.voter?.avatar_url} name={v.voter?.full_name} size={24} />
                    <span className="text-xs text-body">{v.voter?.full_name ?? 'User'}</span>
                    <span className={`ml-auto text-xs font-bold ${v.vote === 'valid' ? 'text-success' : 'text-danger'}`}>
                      {v.vote === 'valid' ? `✅ ${td('voteValid')}` : `❌ ${td('voteInvalid')}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 딴지 이유들 */}
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-edge">
          <h2 className="font-bold text-heading mb-4">🚩 {td('filedDisputes')} ({disputes.length})</h2>
          {disputes.length === 0 ? (
            <p className="text-sm text-hint text-center py-4">{td('noDisputes')}</p>
          ) : (
            <div className="space-y-3">
              {disputes.map((d, i) => (
                <div key={i} className="bg-surface-sunken rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-danger-light flex items-center justify-center text-danger-strong text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-xs font-semibold text-body">
                      {d.reporter?.full_name ?? td('anonymous')}
                    </span>
                    <span className="ml-auto text-[10px] text-hint">
                      {new Date(d.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <p className="text-sm text-body leading-relaxed">{d.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
