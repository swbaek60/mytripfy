import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const MAX_ITEMS = 24

const paramsSchema = z.object({ id: z.string().uuid() })

/**
 * GET /api/users/:id/certs
 *
 * 특정 사용자의 공개 챌린지 인증 목록. 명예의 전당에서 펼쳐 볼 때 사용한다.
 * 로그인 상태라면 "내가 이미 딴지를 건 인증"도 함께 표시한다.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const parsed = paramsSchema.safeParse(await ctx.params)
    if (!parsed.success) return apiError('bad_request', 'Invalid user id.')
    const userId = parsed.data.id

    const db = adminDb()
    const { data: certs, error } = await db
      .from('challenge_certifications')
      .select(
        'challenge_id, image_url, created_at, dispute_status, challenges(title_en, title_ko, category)'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS)

    if (error) return apiDbFailure('users/certs', error)

    const viewer = await requireUser()
    let disputedChallengeIds: string[] = []

    if (!('response' in viewer)) {
      const { data: disputes } = await db
        .from('challenge_disputes')
        .select('cert_challenge_id')
        .eq('reporter_id', viewer.user.profileId)
        .eq('cert_user_id', userId)
      disputedChallengeIds = (disputes ?? []).map((d) => d.cert_challenge_id as string)
    }

    return apiOk({ data: certs ?? [], disputedChallengeIds })
  } catch (err) {
    return apiFailure('users/certs', err)
  }
}
