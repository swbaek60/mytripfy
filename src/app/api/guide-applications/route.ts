import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { resolveGuideApplicationAccess } from '@/lib/api/ownership'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const applySchema = z.object({
  requestId: z.string().uuid(),
  message: z.string().trim().max(2000).nullish(),
})

const statusSchema = z.object({
  appId: z.string().uuid(),
  status: z.enum(['accepted', 'rejected', 'pending']),
})

const cancelSchema = z.object({ requestId: z.string().uuid() })

/** POST /api/guide-applications — 가이드로 지원한다. 재지원 시 기존 지원서를 갱신한다. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'guide-applications:create', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, applySchema)
    if ('response' in parsed) return parsed.response
    const { requestId, message } = parsed.data

    const db = adminDb()

    const { data: request } = await db
      .from('guide_requests')
      .select('id, user_id, status')
      .eq('id', requestId)
      .maybeSingle()

    if (!request) return apiError('not_found', 'Guide request not found.')
    if (request.user_id === auth.user.profileId) {
      return apiError('bad_request', 'You cannot apply to your own request.')
    }
    if (request.status && request.status !== 'open') {
      return apiError('bad_request', 'This request is no longer open.')
    }

    const { data: profile } = await db
      .from('profiles')
      .select('is_guide')
      .eq('id', auth.user.profileId)
      .maybeSingle()

    if (!profile?.is_guide) {
      return apiError('forbidden', 'Enable your guide profile before applying.')
    }

    // 취소 후 재지원을 허용하기 위해 기존 지원서를 지우고 새로 만든다.
    await db
      .from('guide_applications')
      .delete()
      .eq('request_id', requestId)
      .eq('guide_id', auth.user.profileId)

    const { data, error } = await db
      .from('guide_applications')
      .insert({
        request_id: requestId,
        guide_id: auth.user.profileId,
        message: message || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error || !data) return apiDbFailure('guide-applications', error)
    return apiOk({ id: data.id }, { status: 201 })
  } catch (err) {
    return apiFailure('guide-applications', err)
  }
}

/** PATCH /api/guide-applications — 요청 작성자만 수락/거절할 수 있다. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'guide-applications:status', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, statusSchema)
    if ('response' in parsed) return parsed.response
    const { appId, status } = parsed.data

    const db = adminDb()
    const access = await resolveGuideApplicationAccess(db, appId, auth.user.profileId)
    if (!access.ok) return apiError(access.reason === 'not_found' ? 'not_found' : 'forbidden')
    if (access.role !== 'requester') {
      return apiError('forbidden', 'Only the traveler who posted the request can decide.')
    }

    const { error } = await db.from('guide_applications').update({ status }).eq('id', appId)
    if (error) return apiDbFailure('guide-applications', error)

    return apiOk({ id: appId, requestId: access.requestId, guideId: access.guideId })
  } catch (err) {
    return apiFailure('guide-applications', err)
  }
}

/** DELETE /api/guide-applications — 가이드가 본인 지원을 철회한다. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const parsed = await parseJsonBody(req, cancelSchema)
    if ('response' in parsed) return parsed.response

    const { error } = await adminDb()
      .from('guide_applications')
      .delete()
      .eq('request_id', parsed.data.requestId)
      .eq('guide_id', auth.user.profileId)

    if (error) return apiDbFailure('guide-applications', error)
    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('guide-applications', err)
  }
}
