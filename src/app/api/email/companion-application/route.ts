import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/utils/email'
import { companionApplicationEmail } from '@/utils/emailTemplates'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  postId: z.string().uuid(),
  message: z.string().max(2000).nullish(),
})

/**
 * 동행 신청 알림 메일을 호스트에게 발송한다.
 *
 * 신청자는 요청 본문이 아니라 Clerk 세션에서 도출하므로 발신자를 위조할 수 없다.
 * 실제로 해당 게시물에 신청한 사용자만 호출할 수 있다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'email:companion-application', auth.user.profileId, RATE_LIMITS.email)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { postId, message } = parsed.data

    const db = adminDb()

    const { data: application } = await db
      .from('companion_applications')
      .select('id')
      .eq('post_id', postId)
      .eq('applicant_id', auth.user.profileId)
      .maybeSingle()

    if (!application) {
      return apiError('forbidden', 'You have not applied to this trip.')
    }

    const { data: post } = await db
      .from('companion_posts')
      .select('title, user_id')
      .eq('id', postId)
      .maybeSingle()

    if (!post) return apiError('not_found', 'Trip not found.')

    const [{ data: applicant }, { data: host }] = await Promise.all([
      db.from('profiles').select('full_name, avatar_url').eq('id', auth.user.profileId).maybeSingle(),
      db.from('profiles').select('full_name, email').eq('id', post.user_id).maybeSingle(),
    ])

    if (!host?.email) return apiOk({ sent: 0, reason: 'host_email_missing' })

    const { subject, html } = companionApplicationEmail({
      hostName: host.full_name || 'Host',
      applicantName: applicant?.full_name || 'A traveler',
      applicantAvatarUrl: applicant?.avatar_url || undefined,
      postTitle: post.title,
      postId,
      message: message || undefined,
      locale: process.env.DEFAULT_LOCALE || 'en',
    })

    await sendEmail({ to: host.email, subject, html })
    return apiOk({ sent: 1 })
  } catch (err) {
    return apiFailure('email/companion-application', err)
  }
}
