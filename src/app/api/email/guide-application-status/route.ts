import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/utils/email'
import { guideApplicationAcceptedEmail, guideApplicationRejectedEmail } from '@/utils/emailTemplates'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { ownsGuideRequest } from '@/lib/api/ownership'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  requestId: z.string().uuid(),
  guideId: z.string().uuid(),
  status: z.enum(['accepted', 'rejected']),
})

/**
 * 가이드 지원 수락/거절 결과 메일을 가이드에게 발송한다.
 * 요청 작성자만 호출할 수 있다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(
      req,
      'email:guide-application-status',
      auth.user.profileId,
      RATE_LIMITS.email
    )
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { requestId, guideId, status } = parsed.data

    const db = adminDb()

    if (!(await ownsGuideRequest(db, requestId, auth.user.profileId))) {
      return apiError('forbidden', 'Only the request owner can send this notification.')
    }

    const { data: application } = await db
      .from('guide_applications')
      .select('id')
      .eq('request_id', requestId)
      .eq('guide_id', guideId)
      .maybeSingle()

    if (!application) return apiError('not_found', 'Application not found.')

    const [{ data: request }, { data: guide }, { data: owner }] = await Promise.all([
      db.from('guide_requests').select('title').eq('id', requestId).maybeSingle(),
      db.from('profiles').select('full_name, email').eq('id', guideId).maybeSingle(),
      db.from('profiles').select('full_name').eq('id', auth.user.profileId).maybeSingle(),
    ])

    if (!guide?.email) return apiOk({ sent: 0, reason: 'guide_email_missing' })

    const requestTitle = request?.title || 'Guide request'
    const guideName = guide.full_name || 'Guide'
    const locale = process.env.DEFAULT_LOCALE || 'en'

    const { subject, html } =
      status === 'accepted'
        ? guideApplicationAcceptedEmail({
            guideName,
            ownerName: owner?.full_name || 'The traveler',
            requestTitle,
            requestId,
            locale,
          })
        : guideApplicationRejectedEmail({ guideName, requestTitle, locale })

    await sendEmail({ to: guide.email, subject, html })
    return apiOk({ sent: 1 })
  } catch (err) {
    return apiFailure('email/guide-application-status', err)
  }
}
