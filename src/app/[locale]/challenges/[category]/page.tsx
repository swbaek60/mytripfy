import { createClient, getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import ChallengeClient, { type Certification } from './ChallengeClient'
import { notFound } from 'next/navigation'
import { getChallengesForCategoryWithLocale } from '@/utils/challengeTranslations'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { resolveChallengeImageHints } from '@/lib/challenge-image/resolve'
import { CHALLENGE_CATEGORY_META, isChallengeCategoryKey } from '@/data/challenge-category-meta'

export interface CommunityCert {
  user_id: string
  challenge_id: string
  image_url: string
  created_at: string
  dispute_status: string
  full_name: string
  avatar_url: string | null
  already_disputed: boolean
}

const CATEGORY_MAP: Record<string, { emoji: string }> = Object.fromEntries(
  Object.entries(CHALLENGE_CATEGORY_META).map(([key, meta]) => [key, { emoji: meta.emoji }])
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}): Promise<Metadata> {
  const { locale, category } = await params
  const catInfo = CATEGORY_MAP[category]
  if (!catInfo || !isChallengeCategoryKey(category)) return { title: 'Challenges | mytripfy' }
  const meta = CHALLENGE_CATEGORY_META[category]
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  return buildPageMetadata({
    locale,
    path: `/challenges/${category}`,
    title: `${tm(meta.titleKey)} | mytripfy`,
    description: tm(meta.descKey),
    keywords: ['travel challenge', category.replace(/_/g, ' '), 'mytripfy', 'bucket list'],
  })
}

export default async function CategoryChallengePage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale, category } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  const tc = await getTranslations({ locale, namespace: 'Challenges' })
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  const tCommon = await getTranslations({ locale, namespace: 'Common' })
  const catInfo = CATEGORY_MAP[category]
  if (!catInfo || !isChallengeCategoryKey(category)) notFound()
  const categoryMeta = CHALLENGE_CATEGORY_META[category]

  // 챌린지 목록 조회 + locale별 번역 (없으면 en 폴백)
  const challenges = await getChallengesForCategoryWithLocale(supabase, category, locale)

  // 이미지 URL 표는 서버에만 두고 항목별 결과만 내려보낸다 (클라이언트 번들 390KB 절감).
  const challengesWithImageHints = challenges.map(c => ({
    ...c,
    imageHints: resolveChallengeImageHints(c.category, c.title_en),
  }))

  // 내가 인증한 내역 조회 (인증샷은 필수라 image_url 이 빈 행은 손상된 데이터로 보고 제외한다)
  let myCertifications: Certification[] = []
  // 이 카테고리에서 "가고 싶음" 표시한 챌린지 id 목록
  let initialWishIds: string[] = []
  if (user) {
    // 이 카테고리의 챌린지만 조회한다. 전체를 가져오면 아래 달성률이 다른
    // 카테고리 인증까지 세서 "120 / 100" 같은 값이 나온다.
    const categoryIds = challenges.map(c => c.id)
    const [certsRes, wishesRes] = await Promise.all([
      supabase
        .from('challenge_certifications')
        .select('challenge_id, image_url, created_at')
        .eq('user_id', user.id)
        .in('challenge_id', categoryIds),
      supabase.from('challenge_wishes').select('challenge_id').eq('user_id', user.id),
    ])
    myCertifications = (certsRes.data ?? [])
      .filter((c): c is Certification => typeof c.image_url === 'string' && c.image_url.length > 0)
    const challengeIds = new Set(categoryIds)
    initialWishIds = (wishesRes.data || []).map(w => w.challenge_id).filter(id => challengeIds.has(id))
  }

  // 커뮤니티 인증 (다른 사용자) + 내 딴지 이력 조회
  const challengeIds = challenges.map(c => c.id)
  let communityCerts: CommunityCert[] = []
  let myCertCountAll = 0

  if (challengeIds.length > 0) {
    // 다른 사람들의 최근 인증 (최대 60건)
    // 필터는 order/limit 전에 모두 붙인다 (transform 단계에서는 filter 를 쓸 수 없다).
    const commFilters = supabase
      .from('challenge_certifications')
      .select('user_id, challenge_id, image_url, created_at, dispute_status, profiles(full_name, avatar_url)')
      .in('challenge_id', challengeIds)

    const { data: commData } = await (user ? commFilters.neq('user_id', user.id) : commFilters)
      .order('created_at', { ascending: false })
      .limit(60)

    let myDisputeKeys = new Set<string>()
    if (user) {
      const [disputesRes, certCountRes] = await Promise.all([
        supabase.from('challenge_disputes').select('cert_challenge_id, cert_user_id').eq('reporter_id', user.id),
        supabase.from('challenge_certifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      myDisputeKeys = new Set((disputesRes.data || []).map((d: { cert_user_id: string; cert_challenge_id: string }) => `${d.cert_user_id}_${d.cert_challenge_id}`))
      myCertCountAll = certCountRes.count || 0
    }

    communityCerts = (commData || []).map((c: Record<string, unknown>) => {
      const profile = c.profiles as { full_name: string | null; avatar_url: string | null } | null
      return {
        user_id: c.user_id as string,
        challenge_id: c.challenge_id as string,
        image_url: c.image_url as string,
        created_at: c.created_at as string,
        dispute_status: (c.dispute_status as string) || 'clean',
        full_name: profile?.full_name || tCommon('anonymous'),
        avatar_url: profile?.avatar_url || null,
        already_disputed: myDisputeKeys.has(`${c.user_id}_${c.challenge_id}`),
      }
    })
  }

  // 달성률 계산 — 분모는 실제로 등록된 챌린지 수 (시딩이 덜 된 카테고리도 정확하게)
  const totalCount = challenges.length || 100
  const completedCount = myCertifications.length
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100))

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-challenge-light/40 via-surface to-surface border-b border-edge">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link href={`/${locale}/challenges`} className="text-sm text-subtle hover:text-challenge mb-4 inline-block">
            {tc('backToHub')}
          </Link>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-4xl mb-2">{catInfo.emoji}</div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-heading tracking-tight">{tm(categoryMeta.titleKey)}</h1>
              <p className="text-subtle text-sm mt-2 max-w-lg">{tm(categoryMeta.descKey)}</p>
            </div>
            
            {/* Progress UI */}
            {user ? (
              <div className="w-full max-w-xs bg-surface p-4 rounded-2xl border border-edge shadow-sm">
                <div className="flex justify-between text-sm font-bold text-body mb-2">
                  <span>{tc('myProgress')}</span>
                  <span className="text-challenge">{tc('progressCompleted', { completed: completedCount, total: totalCount })}</span>
                </div>
                <div className="w-full bg-edge-strong rounded-full h-2.5">
                  <div className="bg-challenge h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-subtle bg-surface-sunken px-4 py-2 rounded-lg">
                {tc('loginToTrackProgress')}
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ChallengeClient
          userId={user?.id}
          locale={locale}
          challenges={challengesWithImageHints}
          initialCertifications={myCertifications}
          initialWishIds={initialWishIds}
          communityCerts={communityCerts}
          myCertCount={myCertCountAll}
        />
      </main>
    </div>
  )
}
