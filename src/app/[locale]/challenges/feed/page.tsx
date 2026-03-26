import { createClient, getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import CertFeedClient from './CertFeedClient'
import { getDisputeLabels } from '@/data/dispute-labels'
import { getTranslationsForChallenges } from '@/utils/challengeTranslations'
import { getTranslations } from 'next-intl/server'

export default async function ChallengeFeedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const L = getDisputeLabels(locale)
  const t = await getTranslations({ locale, namespace: 'ChallengeFeed' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  // 최근 인증 목록 (invalidated 제외)
  const { data: certs } = await supabase
    .from('challenge_certifications')
    .select(`
      user_id,
      challenge_id,
      image_url,
      created_at,
      dispute_status,
      profiles(full_name, avatar_url),
      challenges(title_en, title_ko, category, points, country_code)
    `)
    .neq('dispute_status', 'invalidated')
    .order('created_at', { ascending: false })
    .limit(60)

  // 딴지 건수 집계
  const { data: disputes } = await supabase
    .from('challenge_disputes')
    .select('cert_user_id, cert_challenge_id, id, status')

  // 내가 신고한 목록
  let myDisputes: { cert_user_id: string; cert_challenge_id: string }[] = []
  if (user) {
    const { data: mine } = await supabase
      .from('challenge_disputes')
      .select('cert_user_id, cert_challenge_id')
      .eq('reporter_id', user.id)
    myDisputes = mine || []
  }

  // 내 인증 수 (딴지 자격 조건: 3개 이상)
  let myCertCount = 0
  if (user) {
    const { count } = await supabase
      .from('challenge_certifications')
      .select('challenge_id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    myCertCount = count || 0
  }

  // 딴지 수 맵 생성
  const disputeMap: Record<string, number> = {}
  for (const d of disputes || []) {
    const key = `${d.cert_user_id}__${d.cert_challenge_id}`
    disputeMap[key] = (disputeMap[key] || 0) + 1
  }

  const myDisputeSet = new Set(
    myDisputes.map(d => `${d.cert_user_id}__${d.cert_challenge_id}`)
  )

  const challengeIds = [...new Set((certs || []).map(c => c.challenge_id))]
  const translations = await getTranslationsForChallenges(supabase, challengeIds, locale)

  const enrichedCerts = (certs || []).map(c => {
    const ch = c.challenges as any
    const tr = translations.get(c.challenge_id)
    const title = tr?.title ?? ch?.title_en ?? ''
    return {
      user_id: c.user_id,
      challenge_id: c.challenge_id,
      image_url: c.image_url,
      created_at: c.created_at,
      dispute_status: c.dispute_status,
      full_name: (c.profiles as any)?.full_name ?? 'Unknown',
      avatar_url: (c.profiles as any)?.avatar_url ?? null,
      title_en: ch?.title_en ?? '',
      title_ko: title,
      title,
      category: ch?.category ?? '',
      points: ch?.points ?? 0,
      country_code: ch?.country_code ?? null,
      dispute_count: disputeMap[`${c.user_id}__${c.challenge_id}`] || 0,
      already_disputed: myDisputeSet.has(`${c.user_id}__${c.challenge_id}`),
    }
  })

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/challenges" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-heading">🌍 {t('feedTitle')}</h1>
            <p className="text-sm text-subtle mt-0.5">
              {t('feedSubtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/challenges/guide`}>
              <button className="flex items-center gap-1.5 border border-amber-300 bg-amber-light text-amber-700 text-xs font-bold px-3 py-2 rounded-full hover:bg-amber transition-colors">
                🚩 {L.systemName}
              </button>
            </Link>
            <Link href={`/${locale}/challenges`}>
              <button className="border border-edge bg-surface text-body text-xs font-semibold px-3 py-2 rounded-full hover:bg-surface-hover transition-colors">
                ← 챌린지 허브
              </button>
            </Link>
          </div>
        </div>

        {/* 안내 배너 */}
        <div className="bg-amber-light border border-amber-200 rounded-2xl px-5 py-3.5 mb-6 flex items-start gap-3">
          <span className="text-xl shrink-0">💡</span>
          <div className="text-sm text-amber-800">
            <strong>{L.systemName}</strong>: {L.tagline}.&nbsp;
            <Link href={`/${locale}/challenges/guide`} className="underline font-semibold">{t('learnMore')}</Link>
          </div>
        </div>

        <CertFeedClient
          certs={enrichedCerts}
          currentUserId={user?.id ?? null}
          locale={locale}
          myCertCount={myCertCount}
          labels={L}
        />
      </main>
    </div>
  )
}
