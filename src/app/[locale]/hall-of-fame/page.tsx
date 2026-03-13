import { createClient } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import { getLevelInfo, getCountryByCode } from '@/data/countries'
import { getTranslations } from 'next-intl/server'
import { Trophy, Medal, Award, Compass, Users, LayoutList } from 'lucide-react'
import HallOfFameList from './HallOfFameList'
import {
  getTierForPoints,
  getNextTier,
  CHALLENGE_TIERS,
  getContributionTierForPoints,
  getNextContributionTier,
  CONTRIBUTION_TIERS,
} from '@/data/challengeTiers'

const PAGE_SIZE = 100

type LeaderRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  travel_level: number | null
  nationality: string | null
  challenge_points?: number
  contribution_points?: number
  total_points?: number
}

export default async function HallOfFamePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { locale } = await params
  const { tab: tabParam } = await searchParams
  const tab = tabParam === 'experience' ? 'experience' : tabParam === 'contribution' ? 'contribution' : 'overall'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations({ locale, namespace: 'HallOfFame' })

  // 경험 랭킹 (챌린지) — 뷰 → profiles fallback → 인증 테이블 직접 집계
  let experienceList: LeaderRow[] = []
  const { data: fromExpView } = await supabase
    .from('hall_of_fame_leaderboard')
    .select('id, full_name, username, avatar_url, travel_level, nationality, challenge_points')
    .order('challenge_points', { ascending: false })
    .limit(PAGE_SIZE)
  if (fromExpView?.length) {
    experienceList = fromExpView as LeaderRow[]
  } else {
    const { data: fromProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, travel_level, nationality, challenge_points')
      .gt('challenge_points', 0)
      .order('challenge_points', { ascending: false })
      .limit(PAGE_SIZE)
    experienceList = (fromProfiles ?? []) as LeaderRow[]
  }
  // 뷰/프로필 둘 다 비었으면 challenge_certifications에서 직접 집계 (미적용 DB도 동작)
  if (experienceList.length === 0) {
    const { data: certs } = await supabase
      .from('challenge_certifications')
      .select('user_id, challenges(points)')
    const pointsByUser = new Map<string, number>()
    for (const row of certs ?? []) {
      const uid = (row as { user_id: string }).user_id
      const ch = (row as { challenges: { points: number } | { points: number }[] | null }).challenges
      const pts = Array.isArray(ch) ? (ch[0]?.points ?? 0) : (ch?.points ?? 0)
      pointsByUser.set(uid, (pointsByUser.get(uid) ?? 0) + pts)
    }
    const sortedIds = [...pointsByUser.entries()]
      .filter(([, p]) => p > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, PAGE_SIZE)
    if (sortedIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, travel_level, nationality')
        .in('id', sortedIds.map(([id]) => id))
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
      experienceList = sortedIds.map(([id, challenge_points]) => ({
        ...profileMap.get(id),
        id,
        travel_level: (profileMap.get(id) as { travel_level?: number })?.travel_level ?? null,
        challenge_points,
      })) as LeaderRow[]
    }
  }

  // 기여 랭킹 (동행·가이드·리뷰)
  let contributionList: LeaderRow[] = []
  const { data: fromContribView } = await supabase
    .from('contribution_leaderboard')
    .select('id, full_name, username, avatar_url, travel_level, nationality, contribution_points')
    .order('contribution_points', { ascending: false })
    .limit(PAGE_SIZE)
  if (fromContribView?.length) {
    contributionList = fromContribView as LeaderRow[]
  }

  // 종합 랭킹 (경험 + 기여)
  let overallList: LeaderRow[] = []
  const { data: fromOverallView } = await supabase
    .from('overall_leaderboard')
    .select('id, full_name, username, avatar_url, travel_level, nationality, total_points, challenge_points, contribution_points')
    .order('total_points', { ascending: false })
    .limit(PAGE_SIZE)
  if (fromOverallView?.length) {
    overallList = fromOverallView as LeaderRow[]
  } else {
    // 뷰 없거나 비었을 때: 경험 + 기여를 앱에서 합산
    const byId = new Map<string, LeaderRow & { _contrib: number }>()
    for (const r of experienceList) {
      byId.set(r.id, { ...r, _contrib: 0 })
    }
    for (const r of contributionList) {
      const contrib = r.contribution_points ?? 0
      const cur = byId.get(r.id)
      if (cur) {
        cur._contrib = contrib
        cur.total_points = (cur.challenge_points ?? 0) + contrib
      } else {
        byId.set(r.id, {
          ...r,
          challenge_points: 0,
          _contrib: contrib,
          total_points: contrib,
        })
      }
    }
    overallList = [...byId.values()]
      .map((row) => {
        const total = row.total_points ?? (row.challenge_points ?? 0) + row._contrib
        const { _contrib, ...rest } = row
        return { ...rest, contribution_points: _contrib, total_points: total }
      })
      .filter((row) => (row.total_points ?? 0) > 0)
      .sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0))
      .slice(0, PAGE_SIZE)
  }

  const list = tab === 'overall' ? overallList : tab === 'contribution' ? contributionList : experienceList

  // 딴지걸기 지원: 현재 유저의 인증 수 + 딴지 이력
  let myCertCount = 0
  let myDisputedKeys: string[] = []
  if (user) {
    const [certCountRes, disputesRes] = await Promise.all([
      supabase.from('challenge_certifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('challenge_disputes').select('cert_user_id, cert_challenge_id').eq('reporter_id', user.id),
    ])
    myCertCount = certCountRes.count || 0
    myDisputedKeys = (disputesRes.data || []).map((d: { cert_user_id: string; cert_challenge_id: string }) => `${d.cert_user_id}_${d.cert_challenge_id}`)
  }

  const currentUserRank = user ? list.findIndex((r) => r.id === user.id) + 1 || null : null
  let currentUserPoints = 0
  if (user) {
    const inList = list.find((r) => r.id === user.id)
    if (inList) {
      currentUserPoints = (inList.total_points ?? inList.challenge_points ?? inList.contribution_points) ?? 0
    } else if (tab === 'experience') {
      const { data: row } = await supabase.from('hall_of_fame_leaderboard').select('challenge_points').eq('id', user.id).maybeSingle()
      if (row?.challenge_points != null) currentUserPoints = row.challenge_points
      else {
        const { data: prof } = await supabase.from('profiles').select('challenge_points').eq('id', user.id).single()
        currentUserPoints = prof?.challenge_points ?? 0
      }
    } else if (tab === 'contribution') {
      const { data: row } = await supabase.from('contribution_leaderboard').select('contribution_points').eq('id', user.id).maybeSingle()
      currentUserPoints = row?.contribution_points ?? 0
    } else {
      const { data: row } = await supabase.from('overall_leaderboard').select('total_points').eq('id', user.id).maybeSingle()
      currentUserPoints = row?.total_points ?? 0
    }
  }

  // 100위 밖일 때도 순위 표시: 나보다 점수 높은 사람 수 + 1 (쿼리 1회, 인덱스 활용으로 부하 적음)
  let myRankOutsideTop100: number | null = null
  if (user && currentUserRank === null && currentUserPoints > 0) {
    if (tab === 'experience') {
      const { count } = await supabase.from('hall_of_fame_leaderboard').select('*', { count: 'exact', head: true }).gt('challenge_points', currentUserPoints)
      myRankOutsideTop100 = (count ?? 0) + 1
    } else if (tab === 'contribution') {
      const { count } = await supabase.from('contribution_leaderboard').select('*', { count: 'exact', head: true }).gt('contribution_points', currentUserPoints)
      myRankOutsideTop100 = (count ?? 0) + 1
    } else {
      const { count } = await supabase.from('overall_leaderboard').select('*', { count: 'exact', head: true }).gt('total_points', currentUserPoints)
      myRankOutsideTop100 = (count ?? 0) + 1
    }
  }

  const getTier = tab === 'contribution' ? getContributionTierForPoints : getTierForPoints
  const getNext = tab === 'contribution' ? getNextContributionTier : getNextTier
  const tiers = tab === 'contribution' ? CONTRIBUTION_TIERS : CHALLENGE_TIERS
  const nextTier = user ? getNext(currentUserPoints) : null

  const tabExperienceHref = `/${locale}/hall-of-fame?tab=experience`
  const tabContributionHref = `/${locale}/hall-of-fame?tab=contribution`
  const tabOverallHref = `/${locale}/hall-of-fame?tab=overall`

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/hall-of-fame" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-10 h-10" />
            <h1 className="text-2xl sm:text-3xl font-extrabold">{t('title')}</h1>
          </div>
          <p className="text-amber-100 text-sm sm:text-base">{t('subtitle')}</p>

          {/* 탭: 종합 | 경험 | 기여 */}
          <div className="mt-4 flex flex-wrap gap-2 p-1 bg-white/15 rounded-xl w-fit">
            <Link
              href={tabOverallHref}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'overall' ? 'bg-white text-amber-700' : 'text-white/90 hover:bg-white/10'}`}
            >
              <LayoutList className="w-4 h-4" />
              {t('tabOverall')}
            </Link>
            <Link
              href={tabExperienceHref}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'experience' ? 'bg-white text-amber-700' : 'text-white/90 hover:bg-white/10'}`}
            >
              <Compass className="w-4 h-4" />
              {t('tabExperience')}
            </Link>
            <Link
              href={tabContributionHref}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'contribution' ? 'bg-white text-amber-700' : 'text-white/90 hover:bg-white/10'}`}
            >
              <Users className="w-4 h-4" />
              {t('tabContribution')}
            </Link>
          </div>

          <p className="text-amber-200/90 text-xs mt-2">
            {tab === 'experience' ? t('experienceSubtitle') : tab === 'overall' ? t('overallSubtitle') : t('contributionSubtitle')}
          </p>
          {tab === 'contribution' && (
            <p className="text-amber-200/80 text-xs mt-0.5">{t('contributionFormula')}</p>
          )}

          {user && (currentUserRank !== null || myRankOutsideTop100 !== null || currentUserPoints > 0) && (
            <div className="mt-4 p-4 bg-white/15 rounded-xl space-y-3">
              {(currentUserRank !== null || myRankOutsideTop100 !== null) && (
                <p className="text-lg sm:text-xl font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                  {t('myRank', { rank: currentUserRank ?? myRankOutsideTop100 ?? 0 })}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-white/95">{currentUserPoints} pts</span>
                {(() => {
                  const tier = getTier(currentUserPoints)
                  const label = t(`tier_${tier.key}` as any)
                  return (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: tier.color }}
                    >
                      {tier.emoji} {label}
                    </span>
                  )
                })()}
                {nextTier && (
                  <span className="text-amber-100 text-sm">
                    {t('nextRank', { points: nextTier.pointsNeeded })}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/challenges`}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-sm font-semibold px-4 py-2 rounded-full transition-colors"
            >
              🏆 {t('goChallenges')}
            </Link>
            {user && (
              <Link
                href={`/${locale}/users/${user.id}`}
                className="inline-flex items-center gap-1.5 bg-white text-amber-700 hover:bg-amber-50 text-sm font-semibold px-4 py-2 rounded-full transition-colors"
              >
                {t('myProfile')}
              </Link>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-500" />
            {t('leaderboard')}
          </h2>

          {list.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">
                {tab === 'experience' ? t('noLeadersYet') : tab === 'overall' ? t('noLeadersYet') : t('noContributorsYet')}
              </p>
              <p className="text-sm mt-1">
                {tab === 'experience' ? t('beFirst') : tab === 'overall' ? t('beFirst') : t('contributionCta')}
              </p>
              {(tab === 'experience' || tab === 'overall') && (
                <Link href={`/${locale}/challenges`} className="inline-block mt-4 text-amber-600 font-semibold text-sm hover:underline">
                  {t('goChallenges')} →
                </Link>
              )}
            </div>
          ) : (
            <HallOfFameList
              list={list}
              tab={tab}
              locale={locale}
              currentUserId={user?.id ?? null}
              myCertCount={myCertCount}
              myDisputedKeys={myDisputedKeys}
              tierLabels={{
                beginner: t('tier_beginner'),
                apprentice: t('tier_apprentice'),
                trainee: t('tier_trainee'),
                intermediate: t('tier_intermediate'),
                advanced: t('tier_advanced'),
                expert: t('tier_expert'),
                master: t('tier_master'),
                grandmaster: t('tier_grandmaster'),
                legend: t('tier_legend'),
              }}
              anonymousLabel={t('anonymous')}
              pointsLabel={t('points')}
            />
          )}
        </div>

        {/* 등급 안내 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{t('rankTiersTitle')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('rankTiersIntro')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tiers.map((tier) => {
              const label = t(`tier_${tier.key}` as any)
              const range =
                tier.maxPoints != null
                  ? t('pointsRange', { min: tier.minPoints, max: tier.maxPoints })
                  : `${tier.minPoints}+ pts`
              return (
                <div
                  key={tier.key}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100"
                  style={{ borderLeftColor: tier.color, borderLeftWidth: 4 }}
                >
                  <span className="text-xl">{tier.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{label}</p>
                    <p className="text-xs text-gray-500">{range}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">{t('rankingNote')}</p>
      </main>
    </div>
  )
}
