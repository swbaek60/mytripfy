import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

/** 신고 자격: 본인이 먼저 인증해야 하는 최소 챌린지 수. */
const MIN_OWN_CERTS = 3
/** 인증 후 이 기간이 지나면 이의제기를 받지 않는다. */
const DISPUTE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

const bodySchema = z.object({
  cert_user_id: z.string().uuid(),
  cert_challenge_id: z.string().min(1).max(80),
  reason: z.string().trim().min(10).max(1000),
})

/**
 * POST /api/challenges/dispute
 *
 * 다른 사용자의 챌린지 인증에 이의제기(딴지)를 등록한다.
 * 자격 조건·시효·중복 여부를 모두 서버에서 확인한다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'challenges:dispute', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { cert_user_id, cert_challenge_id, reason } = parsed.data

    if (cert_user_id === auth.user.profileId) {
      return apiError('bad_request', 'You cannot report your own certification.')
    }

    const db = adminDb()

    const [myCertsRes, certRes, existingRes] = await Promise.all([
      db
        .from('challenge_certifications')
        .select('challenge_id', { count: 'exact', head: true })
        .eq('user_id', auth.user.profileId),
      db
        .from('challenge_certifications')
        .select('created_at, dispute_status')
        .eq('user_id', cert_user_id)
        .eq('challenge_id', cert_challenge_id)
        .maybeSingle(),
      db
        .from('challenge_disputes')
        .select('id')
        .eq('cert_user_id', cert_user_id)
        .eq('cert_challenge_id', cert_challenge_id)
        .eq('reporter_id', auth.user.profileId)
        .maybeSingle(),
    ])

    if ((myCertsRes.count ?? 0) < MIN_OWN_CERTS) {
      return apiError(
        'forbidden',
        `Certify at least ${MIN_OWN_CERTS} challenges before reporting others.`
      )
    }

    const cert = certRes.data
    if (!cert) return apiError('not_found', 'That certification does not exist.')
    if (cert.dispute_status === 'invalidated') {
      return apiError('bad_request', 'This certification is already invalidated.')
    }
    if (Date.now() - new Date(cert.created_at).getTime() > DISPUTE_WINDOW_MS) {
      return apiError('bad_request', 'Certifications older than 30 days cannot be reported.')
    }
    if (existingRes.data) return apiError('conflict', 'You already reported this certification.')

    const { error: insertErr } = await db.from('challenge_disputes').insert({
      cert_user_id,
      cert_challenge_id,
      reporter_id: auth.user.profileId,
      reason,
      points_staked: 5,
    })
    if (insertErr) return apiDbFailure('challenges/dispute', insertErr)

    // 신고가 정족수를 넘으면 이 함수가 인증 상태를 reviewing 으로 바꾼다.
    await db.rpc('handle_new_dispute', {
      p_cert_user_id: cert_user_id,
      p_cert_challenge_id: cert_challenge_id,
    })

    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('challenges/dispute', err)
  }
}
