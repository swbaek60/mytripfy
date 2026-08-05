import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/utils/email'
import { guideRequestNotifyEmail } from '@/utils/emailTemplates'
import { getLanguageByCode } from '@/data/languages'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { ownsGuideRequest } from '@/lib/api/ownership'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  requestId: z.string().uuid(),
})

/** 한 번의 요청으로 알릴 수 있는 가이드 수 상한 (대량 발송 남용 방지) */
const MAX_RECIPIENTS = 50

/**
 * 새 가이드 요청을 매칭되는 가이드들에게 알린다.
 * 요청 작성자만 호출할 수 있고, 요청당 1회로 제한한다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'email:guide-request', auth.user.profileId, RATE_LIMITS.email)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { requestId } = parsed.data

    const db = adminDb()

    if (!(await ownsGuideRequest(db, requestId, auth.user.profileId))) {
      return apiError('forbidden', 'Only the request owner can notify guides.')
    }

    const { data: request } = await db
      .from('guide_requests')
      .select(
        'id, title, user_id, destination_country, destination_city, start_date, end_date, preferred_languages'
      )
      .eq('id', requestId)
      .maybeSingle()

    if (!request) return apiError('not_found', 'Request not found.')

    const { data: requester } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', request.user_id)
      .maybeSingle()

    let guidesQuery = db
      .from('profiles')
      .select('id, full_name, email, spoken_languages')
      .eq('is_guide', true)
      .not('email', 'is', null)
      .neq('id', request.user_id)
      .limit(MAX_RECIPIENTS)

    if (request.destination_country) {
      guidesQuery = guidesQuery.contains('guide_regions', [request.destination_country])
    }

    const { data: allGuides } = await guidesQuery
    if (!allGuides?.length) return apiOk({ sent: 0, total: 0, reason: 'no_matching_guides' })

    const preferredLangs: string[] = request.preferred_languages || []
    const matchedGuides =
      preferredLangs.length > 0
        ? allGuides.filter((guide) => {
            const skills = (guide.spoken_languages as Array<{ lang: string }>) || []
            return skills.some((skill) => preferredLangs.includes(skill.lang))
          })
        : allGuides

    if (!matchedGuides.length) {
      return apiOk({ sent: 0, total: 0, reason: 'no_language_matched_guides' })
    }

    const languageNames = preferredLangs
      .map((code) => getLanguageByCode(code)?.name)
      .filter(Boolean) as string[]

    const locale = process.env.DEFAULT_LOCALE || 'en'
    const results = await Promise.allSettled(
      matchedGuides.map((guide) => {
        const { subject, html } = guideRequestNotifyEmail({
          guideName: guide.full_name || 'Guide',
          requesterName: requester?.full_name || 'A traveler',
          requestTitle: request.title,
          country: request.destination_country,
          city: request.destination_city || undefined,
          startDate: request.start_date,
          endDate: request.end_date,
          languages: languageNames.length > 0 ? languageNames : undefined,
          requestId: request.id,
          locale,
        })
        return sendEmail({ to: guide.email, subject, html })
      })
    )

    return apiOk({
      sent: results.filter((r) => r.status === 'fulfilled').length,
      total: matchedGuides.length,
    })
  } catch (err) {
    return apiFailure('email/guide-request', err)
  }
}
