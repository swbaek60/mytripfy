import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { assertOwnedImageUrl } from '@/lib/api/image-url'
import { ownsGuideRequest } from '@/lib/api/ownership'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

const requestFields = {
  title: z.string().trim().min(2).max(120),
  destinationCountry: z.string().trim().min(2).max(80),
  destinationCity: z.string().trim().max(300).nullish(),
  startDate: isoDate,
  endDate: isoDate,
  description: z.string().trim().max(4000).nullish(),
  coverImage: z.string().url().max(600).nullish(),
  preferredLanguages: z.array(z.string().trim().min(2).max(12)).max(10).optional(),
}

const createSchema = z.object(requestFields)
const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'matched', 'closed']).optional(),
  ...requestFields,
})

type RequestInput = z.infer<typeof createSchema>

function toRow(input: RequestInput) {
  return {
    title: input.title,
    destination_country: input.destinationCountry,
    destination_city: input.destinationCity?.trim() || null,
    start_date: input.startDate,
    end_date: input.endDate,
    description: input.description?.trim() || null,
    cover_image: input.coverImage || null,
    preferred_languages: input.preferredLanguages?.length ? input.preferredLanguages : null,
  }
}

function validateDates(input: RequestInput) {
  if (input.endDate < input.startDate) {
    return apiError('bad_request', 'End date must be on or after the start date.')
  }
  return null
}

/** POST /api/guide-requests — 가이드 요청 생성. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'guide-requests:create', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, createSchema)
    if ('response' in parsed) return parsed.response

    const dateError = validateDates(parsed.data)
    if (dateError) return dateError

    const coverError = assertOwnedImageUrl('photos', parsed.data.coverImage, auth.user.profileId)
    if (coverError) return coverError

    const { data, error } = await adminDb()
      .from('guide_requests')
      .insert({ ...toRow(parsed.data), user_id: auth.user.profileId, status: 'open' })
      .select('id')
      .single()

    if (error || !data) return apiDbFailure('guide-requests', error)
    return apiOk({ id: data.id }, { status: 201 })
  } catch (err) {
    return apiFailure('guide-requests', err)
  }
}

/** PATCH /api/guide-requests — 본인 요청 수정. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'guide-requests:update', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, updateSchema)
    if ('response' in parsed) return parsed.response
    const { id, status, ...input } = parsed.data

    const dateError = validateDates(parsed.data)
    if (dateError) return dateError

    const coverError = assertOwnedImageUrl('photos', input.coverImage, auth.user.profileId)
    if (coverError) return coverError

    const db = adminDb()
    if (!(await ownsGuideRequest(db, id, auth.user.profileId))) return apiError('forbidden')

    const { error } = await db
      .from('guide_requests')
      .update({
        ...toRow(input),
        ...(status ? { status } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return apiDbFailure('guide-requests', error)
    return apiOk({ id })
  } catch (err) {
    return apiFailure('guide-requests', err)
  }
}

/** DELETE /api/guide-requests — 본인 요청 삭제. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const parsed = await parseJsonBody(req, z.object({ id: z.string().uuid() }))
    if ('response' in parsed) return parsed.response

    const db = adminDb()
    if (!(await ownsGuideRequest(db, parsed.data.id, auth.user.profileId))) {
      return apiError('forbidden')
    }

    const { error } = await db.from('guide_requests').delete().eq('id', parsed.data.id)
    if (error) return apiDbFailure('guide-requests', error)

    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('guide-requests', err)
  }
}
