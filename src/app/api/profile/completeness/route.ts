import { adminDb, requireUser } from '@/lib/api/guard'
import { apiFailure, apiOk } from '@/lib/api/respond'
import { CACHE_PRIVATE_SHORT } from '@/lib/http-cache'
import { getProfileCompleteness } from '@/utils/profileCompleteness'

/**
 * GET /api/profile/completeness
 * 로그인 사용자의 프로필 완성도(percent, nextStepKey) 반환. 대시보드 배너 등에 사용.
 */
export async function GET() {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const db = adminDb()
    const userId = auth.user.profileId

    const [profileRes, visitedRes, certRes] = await Promise.all([
      db
        .from('profiles')
        .select(
          'full_name, bio, avatar_url, nationality, instagram_url, facebook_url, twitter_url, whatsapp, telegram, line_id, profile_photos, spoken_languages, is_guide, guide_city_regions, email_verified'
        )
        .eq('id', userId)
        .maybeSingle(),
      db.from('visited_countries').select('country_code').eq('user_id', userId),
      db.from('challenge_certifications').select('challenge_id').eq('user_id', userId),
    ])

    const profile = profileRes.data
    const certIds = (certRes.data ?? []).map((r) => r.challenge_id)

    // 국가 챌린지 인증도 "방문한 나라"로 센다.
    const { data: certChallenges } = certIds.length
      ? await db
          .from('challenges')
          .select('id, country_code')
          .eq('category', 'countries')
          .in('id', certIds)
      : { data: [] as { country_code: string | null }[] }

    const codes = new Set<string>()
    for (const v of visitedRes.data ?? []) if (v.country_code) codes.add(v.country_code)
    for (const c of certChallenges ?? []) if (c.country_code) codes.add(c.country_code)

    const { percent, nextStepKey, earned, total } = getProfileCompleteness(
      profile,
      codes.size,
      !!profile?.email_verified
    )

    return apiOk({ percent, nextStepKey, earned, total }, { cache: CACHE_PRIVATE_SHORT })
  } catch (err) {
    return apiFailure('profile/completeness', err)
  }
}
