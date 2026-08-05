import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  challengeId: z.string().uuid(),
})

/** 챌린지 위시리스트를 토글한다. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'challenges:wishes', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { challengeId } = parsed.data

    const db = adminDb()

    const { data: challenge } = await db
      .from('challenges')
      .select('id')
      .eq('id', challengeId)
      .maybeSingle()
    if (!challenge) return apiError('not_found', 'Challenge not found.')

    const filter = { user_id: auth.user.profileId, challenge_id: challengeId }
    const { data: existing } = await db
      .from('challenge_wishes')
      .select('id')
      .match(filter)
      .maybeSingle()

    if (existing) {
      const { error } = await db.from('challenge_wishes').delete().eq('id', existing.id)
      if (error) return apiDbFailure('challenges/wishes', error)
      return apiOk({ wished: false })
    }

    const { error } = await db.from('challenge_wishes').insert(filter)
    if (error) return apiDbFailure('challenges/wishes', error)
    return apiOk({ wished: true })
  } catch (err) {
    return apiFailure('challenges/wishes', err)
  }
}
