import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/utils/email'
import { contactGuideEmail } from '@/utils/emailTemplates'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  guideId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
})

/** 가이드에게 문의 메일을 보낸다. 발신자는 Clerk 세션에서 도출한다. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'email:contact-guide', auth.user.profileId, RATE_LIMITS.email)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { guideId, message } = parsed.data

    if (guideId === auth.user.profileId) {
      return apiError('bad_request', 'You cannot contact yourself.')
    }

    const db = adminDb()

    const [{ data: sender }, { data: guide }] = await Promise.all([
      db.from('profiles').select('id, full_name, email').eq('id', auth.user.profileId).maybeSingle(),
      db.from('profiles').select('id, full_name, email').eq('id', guideId).maybeSingle(),
    ])

    if (!sender) return apiError('unauthorized')
    if (!guide?.email) return apiError('not_found', 'This guide cannot be reached by email.')

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
    const locale = process.env.DEFAULT_LOCALE || 'en'

    const { subject, html } = contactGuideEmail({
      guideName: guide.full_name || 'Guide',
      senderName: sender.full_name || sender.email || 'A traveler',
      message,
      messagesUrl: `${baseUrl}/${locale}/messages/${sender.id}`,
      locale,
    })

    const result = await sendEmail({
      to: guide.email,
      subject,
      html,
      replyTo: sender.email ?? undefined,
    })

    if (!result.success) {
      console.error('[api/email/contact-guide] delivery failed via', result.provider, result.error)
      return apiError('unavailable', 'Email delivery failed. Please try again later.')
    }

    return apiOk({ sent: 1 })
  } catch (err) {
    return apiFailure('email/contact-guide', err)
  }
}
