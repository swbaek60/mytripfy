import { createClient, getAuthUser, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getProfileCompleteness } from '@/utils/profileCompleteness'

/**
 * GET /api/profile/completeness
 * 로그인 사용자의 프로필 완성도(percent, nextStepKey) 반환. 대시보드 배너 등에 사용.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const authUser = await getAuthUser()
    const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, bio, avatar_url, nationality, instagram_url, facebook_url, twitter_url, whatsapp, telegram, line_id, profile_photos, spoken_languages, is_guide, guide_city_regions, email_verified')
      .eq('id', user.id)
      .single()

    const { data: visited } = await admin
      .from('visited_countries')
      .select('country_code')
      .eq('user_id', user.id)
    const { data: certRows } = await admin
      .from('challenge_certifications')
      .select('challenge_id')
      .eq('user_id', user.id)
    const certIds = (certRows ?? []).map(r => r.challenge_id)
    const { data: certChallenges } = certIds.length > 0
      ? await admin.from('challenges').select('id, country_code').eq('category', 'countries').in('id', certIds)
      : { data: [] }
    const certifiedCodes = new Set((certChallenges ?? []).map(c => c.country_code).filter(Boolean) as string[])
    const visitedCodes = visited?.map(v => v.country_code) ?? []
    const countryCount = new Set([...visitedCodes, ...certifiedCodes]).size
    const emailVerified = !!(profile?.email_verified)

    const { percent, nextStepKey, earned, total } = getProfileCompleteness(profile, countryCount, emailVerified)
    return NextResponse.json({ percent, nextStepKey, earned, total })
  } catch (e) {
    console.error('profile completeness api', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
