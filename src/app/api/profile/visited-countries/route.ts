import { NextRequest } from 'next/server'
import { z } from 'zod'
import { COUNTRIES } from '@/data/countries'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  countryCode: z.string().trim().min(2).max(3),
})

/** 방문 국가를 토글한다. 국가 코드는 서버의 국가 목록으로 검증한다. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'profile:visited-countries', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response

    const code = parsed.data.countryCode.toUpperCase()
    const country = COUNTRIES.find((c) => c.code === code)
    if (!country) return apiError('bad_request', 'Unknown country code.')

    const db = adminDb()
    const filter = { user_id: auth.user.profileId, country_code: code }

    const { data: existing } = await db
      .from('visited_countries')
      .select('id')
      .match(filter)
      .maybeSingle()

    if (existing) {
      const { error } = await db.from('visited_countries').delete().eq('id', existing.id)
      if (error) return apiDbFailure('profile/visited-countries', error)
      return apiOk({ visited: false, countryCode: code })
    }

    const { error } = await db
      .from('visited_countries')
      .insert({ ...filter, country_name: country.name })
    if (error) return apiDbFailure('profile/visited-countries', error)
    return apiOk({ visited: true, countryCode: code })
  } catch (err) {
    return apiFailure('profile/visited-countries', err)
  }
}
