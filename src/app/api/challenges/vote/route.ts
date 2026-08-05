import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  cert_user_id: z.string().uuid(),
  cert_challenge_id: z.string().min(1).max(80),
  vote: z.enum(['valid', 'invalid']),
})

/**
 * POST /api/challenges/vote
 *
 * 인증 이의제기(dispute)에 배심원 투표를 등록한다.
 * 본인 인증·본인이 신고한 건에는 투표할 수 없고, 중복 투표도 막는다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'challenges:vote', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { cert_user_id, cert_challenge_id, vote } = parsed.data

    if (cert_user_id === auth.user.profileId) {
      return apiError('forbidden', 'You cannot vote on your own certification.')
    }

    const db = adminDb()

    const [reporterRes, certRes, existingRes] = await Promise.all([
      // 신고자는 이해충돌로 배심원이 될 수 없다.
      db
        .from('challenge_disputes')
        .select('id')
        .eq('cert_user_id', cert_user_id)
        .eq('cert_challenge_id', cert_challenge_id)
        .eq('reporter_id', auth.user.profileId)
        .maybeSingle(),
      db
        .from('challenge_certifications')
        .select('dispute_status')
        .eq('user_id', cert_user_id)
        .eq('challenge_id', cert_challenge_id)
        .maybeSingle(),
      db
        .from('dispute_votes')
        .select('id')
        .eq('cert_user_id', cert_user_id)
        .eq('cert_challenge_id', cert_challenge_id)
        .eq('voter_id', auth.user.profileId)
        .maybeSingle(),
    ])

    if (reporterRes.data) {
      return apiError('forbidden', 'Reporters cannot serve as jurors on their own report.')
    }
    if (!certRes.data || certRes.data.dispute_status !== 'reviewing') {
      return apiError('bad_request', 'This certification is not under review.')
    }
    if (existingRes.data) return apiError('conflict', 'You already voted.')

    const { error: voteErr } = await db.from('dispute_votes').insert({
      cert_user_id,
      cert_challenge_id,
      voter_id: auth.user.profileId,
      vote,
    })
    if (voteErr) return apiDbFailure('challenges/vote', voteErr)

    // 정족수를 채우면 DB 함수가 판결까지 처리한다.
    const { data: result } = await db.rpc('resolve_cert_dispute', {
      p_cert_user_id: cert_user_id,
      p_cert_challenge_id: cert_challenge_id,
    })

    return apiOk({ success: true, result: result ?? 'pending' })
  } catch (err) {
    return apiFailure('challenges/vote', err)
  }
}
