import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  challengeId: z.coerce.number().int().min(1).max(10_000),
})

/** Bucket List 100 챌린지 완료 여부를 토글한다. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'challenges:track', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { challengeId } = parsed.data

    const db = adminDb()
    const filter = { user_id: auth.user.profileId, challenge_id: challengeId }

    const { data: existing } = await db
      .from('user_challenges')
      .select('id')
      .match(filter)
      .maybeSingle()

    if (existing) {
      const { error } = await db.from('user_challenges').delete().eq('id', existing.id)
      if (error) return apiDbFailure('challenges/track', error)
      return apiOk({ completed: false })
    }

    const { error } = await db.from('user_challenges').insert(filter)
    if (error) return apiDbFailure('challenges/track', error)
    return apiOk({ completed: true })
  } catch (err) {
    return apiFailure('challenges/track', err)
  }
}
