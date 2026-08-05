import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/utils/email'
import {
  companionApplicationAcceptedEmail,
  companionApplicationRejectedEmail,
} from '@/utils/emailTemplates'
import { getCountryByCode } from '@/data/countries'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { ownsCompanionPost } from '@/lib/api/ownership'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  postId: z.string().uuid(),
  applicantId: z.string().uuid(),
  status: z.enum(['accepted', 'rejected']),
})

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

/**
 * 동행 신청 수락/거절 결과 메일을 신청자에게 발송한다.
 * 게시물의 호스트만 호출할 수 있다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(
      req,
      'email:companion-application-status',
      auth.user.profileId,
      RATE_LIMITS.email
    )
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { postId, applicantId, status } = parsed.data

    const db = adminDb()

    if (!(await ownsCompanionPost(db, postId, auth.user.profileId))) {
      return apiError('forbidden', 'Only the trip host can send this notification.')
    }

    const { data: application } = await db
      .from('companion_applications')
      .select('id')
      .eq('post_id', postId)
      .eq('applicant_id', applicantId)
      .maybeSingle()

    if (!application) return apiError('not_found', 'Application not found.')

    const [{ data: post }, { data: applicantProfile }] = await Promise.all([
      db
        .from('companion_posts')
        .select('title, user_id, destination_country, start_date, end_date')
        .eq('id', postId)
        .maybeSingle(),
      db.from('profiles').select('full_name, email').eq('id', applicantId).maybeSingle(),
    ])

    if (!post) return apiError('not_found', 'Trip not found.')
    if (!applicantProfile?.email) return apiOk({ sent: 0, reason: 'applicant_email_missing' })

    const { data: hostProfile } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', post.user_id)
      .maybeSingle()

    const applicantName = applicantProfile.full_name || 'Traveler'
    const locale = process.env.DEFAULT_LOCALE || 'en'

    const { subject, html } =
      status === 'accepted'
        ? companionApplicationAcceptedEmail({
            applicantName,
            hostName: hostProfile?.full_name || 'Host',
            postTitle: post.title,
            postId,
            country: getCountryByCode(post.destination_country)?.name || post.destination_country,
            startDate: formatDate(post.start_date),
            endDate: formatDate(post.end_date),
            locale,
          })
        : companionApplicationRejectedEmail({
            applicantName,
            postTitle: post.title,
            locale,
          })

    await sendEmail({ to: applicantProfile.email, subject, html })
    return apiOk({ sent: 1 })
  } catch (err) {
    return apiFailure('email/companion-application-status', err)
  }
}
