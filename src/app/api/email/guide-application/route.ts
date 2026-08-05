import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/utils/email'
import { guideApplicationEmail } from '@/utils/emailTemplates'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  requestId: z.string().uuid(),
})

/**
 * 가이드 지원 알림 메일을 요청 작성자에게 발송한다.
 * 실제로 해당 요청에 지원한 가이드 본인만 호출할 수 있다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'email:guide-application', auth.user.profileId, RATE_LIMITS.email)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { requestId } = parsed.data

    const db = adminDb()

    const { data: application } = await db
      .from('guide_applications')
      .select('message')
      .eq('request_id', requestId)
      .eq('guide_id', auth.user.profileId)
      .maybeSingle()

    if (!application) {
      return apiError('forbidden', 'You have not applied to this request.')
    }

    const { data: request } = await db
      .from('guide_requests')
      .select('id, title, user_id')
      .eq('id', requestId)
      .maybeSingle()

    if (!request) return apiError('not_found', 'Request not found.')

    const [{ data: owner }, { data: guide }] = await Promise.all([
      db.from('profiles').select('full_name, email').eq('id', request.user_id).maybeSingle(),
      db.from('profiles').select('full_name, avatar_url').eq('id', auth.user.profileId).maybeSingle(),
    ])

    if (!owner?.email) return apiOk({ sent: 0, reason: 'owner_email_missing' })

    const { subject, html } = guideApplicationEmail({
      ownerName: owner.full_name || 'Traveler',
      guideName: guide?.full_name || 'A guide',
      guideAvatarUrl: guide?.avatar_url || undefined,
      requestTitle: request.title,
      requestId: request.id,
      message: application.message || undefined,
      locale: process.env.DEFAULT_LOCALE || 'en',
    })

    await sendEmail({ to: owner.email, subject, html })
    return apiOk({ sent: 1 })
  } catch (err) {
    return apiFailure('email/guide-application', err)
  }
}
