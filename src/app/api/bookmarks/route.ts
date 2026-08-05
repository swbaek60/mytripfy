import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  type: z.enum(['companion_post', 'guide']),
  referenceId: z.string().uuid(),
})

/**
 * 북마크를 토글한다. 대상 사용자는 항상 Clerk 세션에서 도출하므로
 * 다른 사람의 북마크를 조작할 수 없다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'bookmarks', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { type, referenceId } = parsed.data

    const db = adminDb()
    const filter = {
      user_id: auth.user.profileId,
      type,
      reference_id: referenceId,
    }

    const { data: existing } = await db
      .from('bookmarks')
      .select('id')
      .match(filter)
      .maybeSingle()

    if (existing) {
      const { error } = await db.from('bookmarks').delete().eq('id', existing.id)
      if (error) return apiDbFailure('bookmarks', error)
      return apiOk({ bookmarked: false })
    }

    const { error } = await db.from('bookmarks').insert(filter)
    if (error) return apiDbFailure('bookmarks', error)
    return apiOk({ bookmarked: true })
  } catch (err) {
    return apiFailure('bookmarks', err)
  }
}
