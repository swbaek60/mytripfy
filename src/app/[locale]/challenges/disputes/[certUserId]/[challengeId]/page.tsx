import { createClient } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JuryClient from './JuryClient'
import { getDisputeLabels } from '@/data/dispute-labels'
import { getTranslationsForChallenges } from '@/utils/challengeTranslations'

export default async function DisputePage({
  params,
}: {
  params: Promise<{ locale: string; certUserId: string; challengeId: string }>
}) {
  const { locale, certUserId, challengeId } = await params
  const L = getDisputeLabels(locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const challenge = cert.challenges as any
  const translations = await getTranslationsForChallenges(supabase, [cert.challenge_id], locale)
  const tr = translations.get(cert.challenge_id)
  const challengeWithLocale = challenge ? {
    ...challenge,
    title: tr?.title ?? challenge.title_en,
    description: tr?.description ?? challenge.description_en ?? null,
  } : null

  // 딴지 목록
  const { data: disputes } = await supabase
    .from('challenge_disputes')
    .select('id, reporter_id, reason, points_staked, status, created_at, profiles(full_name, avatar_url)')
    .eq('cert_user_id', certUserId)
    .eq('cert_challenge_id', challengeId)
    .order('created_at', { ascending: true })

  // 투표 현황
  const { data: votes } = await supabase
    .from('dispute_votes')
    .select('voter_id, vote, created_at, profiles(full_name, avatar_url)')
    .eq('cert_user_id', certUserId)
    .eq('cert_challenge_id', challengeId)

  const validCount = (votes || []).filter(v => v.vote === 'valid').length
  const invalidCount = (votes || []).filter(v => v.vote === 'invalid').length

  // 내 투표 여부
  const myVote = user ? (votes || []).find(v => v.voter_id === user.id)?.vote ?? null : null

  // 이해충돌 여부 (신고자 / 인증자)
  const isReporter = user ? (disputes || []).some(d => d.reporter_id === user.id) : false
  const isCertOwner = user?.id === certUserId

  const canVote = user && !myVote && !isReporter && !isCertOwner && cert.dispute_status === 'reviewing'

  const profile = cert.profiles as any

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/challenges" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* 뒤로가기 */}
        <Link href={`/${locale}/challenges/feed`} className="text-sm text-subtle hover:text-purple">
          ← 커뮤니티 피드로
        </Link>

        {/* 상태 배너 */}
        {cert.dispute_status === 'reviewing' && (
          <div className="bg-brand-light border-2 border-edge-brand rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <p className="font-bold text-heading">배심원 심사 진행 중</p>
              <p className="text-sm text-brand-hover mt-0.5">
                이 인증에 대해 {(disputes || []).length}건의 딴지가 접수되었습니다.
                현재 커뮤니티 배심원이 투표 중입니다. 3표 이상 무효 판정 시 인증이 취소됩니다.
              </p>
            </div>
          </div>
        )}
        {cert.dispute_status === 'invalidated' && (
          <div className="bg-danger-light border-2 border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-bold text-heading">인증 무효 처리됨</p>
              <p className="text-sm text-danger mt-0.5">배심원 투표 결과 이 인증이 무효 처리되었습니다.</p>
            </div>
          </div>
        )}
        {cert.dispute_status === 'clean' && (
          <div className="bg-success-light border-2 border-green-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-heading">딴지 기각 — 정당한 인증</p>
              <p className="text-sm text-success mt-0.5">배심원 투표 결과 이 인증이 유효하다고 판정되었습니다.</p>
            </div>
          </div>
        )}

        {/* 인증 정보 */}
        <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-edge">
          <div className="relative h-56">
            <img src={cert.image_url} alt={challengeWithLocale?.title ?? challenge?.title_en} className="w-full h-full object-cover" />
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
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white font-bold">
                  {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="font-bold text-heading">{profile?.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-hint">
                  {new Date(cert.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 인증
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
          <h2 className="font-bold text-heading mb-4">⚖️ 배심원 투표 현황</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-success-light rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-success">{validCount}</div>
              <div className="text-sm font-semibold text-success mt-1">✅ 유효 판정</div>
              <div className="text-xs text-success mt-0.5">3표 도달 시 딴지 기각</div>
            </div>
            <div className="bg-danger-light rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-danger">{invalidCount}</div>
              <div className="text-sm font-semibold text-danger mt-1">❌ 무효 판정</div>
              <div className="text-xs text-danger mt-0.5">3표 도달 시 인증 취소</div>
            </div>
          </div>

          {/* 프로그레스 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtle w-8">유효</span>
              <div className="flex-1 bg-surface-sunken rounded-full h-2.5">
                <div className="bg-success h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, (validCount / 3) * 100)}%` }} />
              </div>
              <span className="text-xs text-hint">{validCount}/3</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtle w-8">무효</span>
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
          {(votes || []).length > 0 && (
            <div className="mt-4 pt-4 border-t border-edge">
              <p className="text-xs font-semibold text-subtle mb-2">배심원 투표 내역</p>
              <div className="space-y-2">
                {(votes || []).map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {(v.profiles as any)?.avatar_url ? (
                      <img src={(v.profiles as any).avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center text-subtle text-xs font-bold">
                        {(v.profiles as any)?.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <span className="text-xs text-body">{(v.profiles as any)?.full_name ?? 'User'}</span>
                    <span className={`ml-auto text-xs font-bold ${v.vote === 'valid' ? 'text-success' : 'text-danger'}`}>
                      {v.vote === 'valid' ? '✅ 유효' : '❌ 무효'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 딴지 이유들 */}
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-edge">
          <h2 className="font-bold text-heading mb-4">🚩 접수된 딴지 ({(disputes || []).length}건)</h2>
          {(disputes || []).length === 0 ? (
            <p className="text-sm text-hint text-center py-4">딴지가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {(disputes || []).map((d, i) => (
                <div key={i} className="bg-surface-sunken rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-danger-light flex items-center justify-center text-danger text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-xs font-semibold text-body">
                      {(d.profiles as any)?.full_name ?? '익명'}
                    </span>
                    <span className="ml-auto text-[10px] text-hint">
                      {new Date(d.created_at).toLocaleDateString('ko-KR')}
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
