/**
 * 챌린지 점수 구간별 등급 (게임 랭킹처럼 단계 상승)
 * 명예의 전당·프로필 등에서 사용
 */
export type ChallengeTier = {
  key: string
  minPoints: number
  maxPoints: number | null // null = 무제한
  emoji: string
  color: string // tailwind 또는 hex
}

export const CHALLENGE_TIERS: ChallengeTier[] = [
  { key: 'beginner',    minPoints: 0,    maxPoints: 49,   emoji: '🌱', color: '#9ca3af' },
  { key: 'apprentice',  minPoints: 50,   maxPoints: 149,  emoji: '📗', color: '#22c55e' },
  { key: 'trainee',     minPoints: 150,  maxPoints: 299,  emoji: '📘', color: '#3b82f6' },
  { key: 'intermediate', minPoints: 300, maxPoints: 499,  emoji: '🥉', color: '#a16207' },
  { key: 'advanced',    minPoints: 500,  maxPoints: 749,  emoji: '🥈', color: '#737373' },
  { key: 'expert',      minPoints: 750,  maxPoints: 1099, emoji: '🥇', color: '#d97706' },
  { key: 'master',      minPoints: 1100, maxPoints: 1599, emoji: '💎', color: '#0891b2' },
  { key: 'grandmaster', minPoints: 1600, maxPoints: 2499, emoji: '👑', color: '#7c3aed' },
  { key: 'legend',      minPoints: 2500, maxPoints: null, emoji: '🌟', color: '#eab308' },
]

export function getTierForPoints(points: number): ChallengeTier {
  const p = Math.max(0, points)
  for (let i = CHALLENGE_TIERS.length - 1; i >= 0; i--) {
    const t = CHALLENGE_TIERS[i]
    if (p >= t.minPoints && (t.maxPoints === null || p <= t.maxPoints))
      return t
  }
  return CHALLENGE_TIERS[0]
}

export function getNextTier(points: number): { tier: ChallengeTier; pointsNeeded: number } | null {
  const current = getTierForPoints(points)
  const idx = CHALLENGE_TIERS.indexOf(current)
  if (idx >= CHALLENGE_TIERS.length - 1) return null
  const next = CHALLENGE_TIERS[idx + 1]
  const pointsNeeded = next.minPoints - points
  return { tier: next, pointsNeeded }
}

/** 기여 랭킹용 등급 (동행·가이드·리뷰 점수 구간, 챌린지보다 작은 스케일) */
export const CONTRIBUTION_TIERS: ChallengeTier[] = [
  { key: 'beginner',    minPoints: 0,   maxPoints: 14,   emoji: '🌱', color: '#9ca3af' },
  { key: 'apprentice',  minPoints: 15,  maxPoints: 39,   emoji: '📗', color: '#22c55e' },
  { key: 'trainee',     minPoints: 40,  maxPoints: 79,   emoji: '📘', color: '#3b82f6' },
  { key: 'intermediate', minPoints: 80, maxPoints: 149,  emoji: '🥉', color: '#a16207' },
  { key: 'advanced',    minPoints: 150, maxPoints: 299,  emoji: '🥈', color: '#737373' },
  { key: 'expert',      minPoints: 300, maxPoints: 599,  emoji: '🥇', color: '#d97706' },
  { key: 'master',      minPoints: 600, maxPoints: 999,  emoji: '💎', color: '#0891b2' },
  { key: 'grandmaster', minPoints: 1000, maxPoints: 1999, emoji: '👑', color: '#7c3aed' },
  { key: 'legend',      minPoints: 2000, maxPoints: null, emoji: '🌟', color: '#eab308' },
]

export function getContributionTierForPoints(points: number): ChallengeTier {
  const p = Math.max(0, points)
  for (let i = CONTRIBUTION_TIERS.length - 1; i >= 0; i--) {
    const t = CONTRIBUTION_TIERS[i]
    if (p >= t.minPoints && (t.maxPoints === null || p <= t.maxPoints))
      return t
  }
  return CONTRIBUTION_TIERS[0]
}

export function getNextContributionTier(points: number): { tier: ChallengeTier; pointsNeeded: number } | null {
  const current = getContributionTierForPoints(points)
  const idx = CONTRIBUTION_TIERS.indexOf(current)
  if (idx >= CONTRIBUTION_TIERS.length - 1) return null
  const next = CONTRIBUTION_TIERS[idx + 1]
  const pointsNeeded = next.minPoints - points
  return { tier: next, pointsNeeded }
}
