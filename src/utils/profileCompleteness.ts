/** 프로필 완성도 계산 (ProfileCompleteness와 동일 로직, 서버/API용) */

export interface ProfileForCompleteness {
  full_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  nationality?: string | null
  instagram_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  whatsapp?: string | null
  telegram?: string | null
  line_id?: string | null
  profile_photos?: string[] | null
  spoken_languages?: unknown[] | null
  travel_count?: number
  is_guide?: boolean
  guide_city_regions?: unknown[] | null
}

export function getProfileCompleteness(
  profile: ProfileForCompleteness | null,
  countryCount: number,
  emailVerified: boolean = false
): { percent: number; nextStepKey: string | null; earned: number; total: number } {
  if (!profile) return { percent: 0, nextStepKey: 'email', earned: 0, total: 110 }

  const hasContact = !!(
    profile.instagram_url || profile.facebook_url || profile.twitter_url ||
    profile.whatsapp || profile.telegram || profile.line_id
  )
  const hasLanguages = (profile.spoken_languages?.length ?? 0) > 0
  const hasPhotos = (profile.profile_photos?.length ?? 0) > 0
  const hasBio = !!profile.bio && (profile.bio.length ?? 0) >= 20
  const hasVisited = (countryCount ?? 0) >= 3
  const guideComplete = !!profile.is_guide && (profile.guide_city_regions?.length ?? 0) > 0

  const steps: { key: string; done: boolean; points: number }[] = [
    { key: 'email', done: emailVerified, points: 10 },
    { key: 'name', done: !!profile.full_name, points: 10 },
    { key: 'photo', done: !!profile.avatar_url, points: 15 },
    { key: 'bio', done: hasBio, points: 15 },
    { key: 'nation', done: !!profile.nationality, points: 10 },
    { key: 'langs', done: hasLanguages, points: 15 },
    { key: 'contact', done: hasContact, points: 10 },
    { key: 'visited', done: hasVisited, points: 15 },
    { key: 'photos', done: hasPhotos, points: 5 },
    { key: 'guide', done: guideComplete, points: 5 },
  ]

  const earned = steps.filter(s => s.done).reduce((sum, s) => sum + s.points, 0)
  const total = steps.reduce((sum, s) => sum + s.points, 0)
  const percent = total > 0 ? Math.round((earned / total) * 100) : 0
  const nextStep = steps.find(s => !s.done)
  return { percent, nextStepKey: nextStep?.key ?? null, earned, total }
}
