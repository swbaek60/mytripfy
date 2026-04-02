import { createClient, getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import ChallengeClient from './ChallengeClient'
import { notFound } from 'next/navigation'
import { getChallengesForCategoryWithLocale } from '@/utils/challengeTranslations'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

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

const CATEGORY_MAP: Record<string, { title: string; emoji: string }> = {
  countries:    { title: '100 Countries',    emoji: '🌍' },
  attractions:  { title: '100 Attractions',  emoji: '🏛️' },
  foods:        { title: '100 Foods',        emoji: '🍜' },
  drinks:       { title: '100 Drinks',       emoji: '🍶' },
  restaurants:  { title: '100 Restaurants',  emoji: '🍽️' },
  museums:      { title: '100 Museums',      emoji: '🏺' },
  art_galleries:{ title: '100 Art Galleries',emoji: '🖼️' },
  nature:       { title: '100 Nature Spots', emoji: '🏔️' },
  animals:      { title: '100 Animals',      emoji: '🦁' },
  festivals:    { title: '100 Festivals',    emoji: '🎭' },
  islands:      { title: '100 Islands',      emoji: '🏝️' },
  fishing:      { title: '100 Fishing Spots',emoji: '🎣' },
  golf:         { title: '100 Golf Courses', emoji: '⛳' },
  surfing:      { title: '100 Surf Spots',   emoji: '🏄' },
  skiing:       { title: '100 Ski Resorts',  emoji: '⛷️' },
  scuba:        { title: '100 Dive Sites',   emoji: '🤿' },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}): Promise<Metadata> {
  const { locale, category } = await params
  const catInfo = CATEGORY_MAP[category]
  if (!catInfo) return { title: 'Challenges | mytripfy' }
  return buildPageMetadata({
    locale,
    path: `/challenges/${category}`,
    title: `${catInfo.title} — travel challenges | mytripfy`,
    description: `Browse and complete ${catInfo.title} challenges on mytripfy. Earn points and join the global traveler community.`,
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
  const catInfo = CATEGORY_MAP[category]
  if (!catInfo) notFound()

  // 챌린지 목록 조회 + locale별 번역 (없으면 en 폴백)
  const challenges = await getChallengesForCategoryWithLocale(supabase, category, locale)

  // 내가 인증한 내역 조회
  let myCertifications: any[] = []
  // 이 카테고리에서 "가고 싶음" 표시한 챌린지 id 목록
  let initialWishIds: string[] = []
  if (user) {
    const [certsRes, wishesRes] = await Promise.all([
      supabase.from('challenge_certifications').select('challenge_id, image_url, created_at').eq('user_id', user.id),
      supabase.from('challenge_wishes').select('challenge_id').eq('user_id', user.id),
    ])
    myCertifications = certsRes.data || []
    const challengeIds = new Set(challenges.map(c => c.id))
    initialWishIds = (wishesRes.data || []).map(w => w.challenge_id).filter(id => challengeIds.has(id))
  }

  // 커뮤니티 인증 (다른 사용자) + 내 딴지 이력 조회
  const challengeIds = challenges.map(c => c.id)
  let communityCerts: CommunityCert[] = []
  let myCertCountAll = 0

  if (challengeIds.length > 0) {
    // 다른 사람들의 최근 인증 (최대 60건)
    let commQuery = supabase
      .from('challenge_certifications')
      .select('user_id, challenge_id, image_url, created_at, dispute_status, profiles(full_name, avatar_url)')
      .in('challenge_id', challengeIds)
      .order('created_at', { ascending: false })
      .limit(60)
    if (user) commQuery = (commQuery as any).neq('user_id', user.id)

    const { data: commData } = await commQuery

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
        full_name: profile?.full_name || 'User',
        avatar_url: profile?.avatar_url || null,
        already_disputed: myDisputeKeys.has(`${c.user_id}_${c.challenge_id}`),
      }
    })
  }

  // 달성률 계산
  const totalCount = 100
  const completedCount = myCertifications.length
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100))

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/challenges" />

      {/* Header Banner */}
      <section className="bg-surface border-b border-edge">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Link href={`/${locale}/challenges`} className="text-sm text-subtle hover:text-purple mb-4 inline-block">
            ← Back to Challenges
          </Link>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-4xl mb-2">{catInfo.emoji}</div>
              <h1 className="text-3xl font-extrabold text-heading">{catInfo.title}</h1>
            </div>
            
            {/* Progress UI */}
            {user ? (
              <div className="w-full max-w-xs bg-surface-sunken p-4 rounded-2xl border border-edge">
                <div className="flex justify-between text-sm font-bold text-body mb-2">
                  <span>{tc('myProgress')}</span>
                  <span className="text-purple">{completedCount} / 100</span>
                </div>
                <div className="w-full bg-edge-strong rounded-full h-2.5">
                  <div className="bg-purple h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-subtle bg-surface-sunken px-4 py-2 rounded-lg">
                Login to track your progress
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ChallengeClient
          userId={user?.id}
          locale={locale}
          challenges={challenges}
          initialCertifications={myCertifications}
          initialWishIds={initialWishIds}
          communityCerts={communityCerts}
          myCertCount={myCertCountAll}
        />
      </main>
    </div>
  )
}
