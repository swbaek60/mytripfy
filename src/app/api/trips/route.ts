import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { ownsTrip } from '@/lib/api/ownership'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

const tripFields = {
  title: z.string().trim().min(2).max(120),
  destinationCountry: z.string().trim().max(80).nullish(),
  startDate: isoDate,
  endDate: isoDate,
  visibility: z.enum(['private', 'public']),
  description: z.string().trim().max(8000).nullish(),
}

const createSchema = z.object(tripFields)
const updateSchema = z.object({ id: z.string().uuid(), ...tripFields })

type TripInput = z.infer<typeof createSchema>

function toRow(input: TripInput) {
  return {
    title: input.title,
    destination_country: input.destinationCountry?.trim() || null,
    start_date: input.startDate,
    end_date: input.endDate,
    visibility: input.visibility,
    description: input.description?.trim() || null,
  }
}

/** POST /api/trips — 여행 계획 생성. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'trips:create', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, createSchema)
    if ('response' in parsed) return parsed.response
    if (parsed.data.endDate < parsed.data.startDate) {
      return apiError('bad_request', 'End date must be on or after the start date.')
    }

    const { data, error } = await adminDb()
      .from('trips')
      .insert({ ...toRow(parsed.data), user_id: auth.user.profileId })
      .select('id')
      .single()

    if (error || !data) return apiDbFailure('trips', error)
    return apiOk({ id: data.id }, { status: 201 })
  } catch (err) {
    return apiFailure('trips', err)
  }
}

/** PATCH /api/trips — 본인 여행 계획 수정. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'trips:update', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, updateSchema)
    if ('response' in parsed) return parsed.response
    const { id, ...input } = parsed.data

    if (input.endDate < input.startDate) {
      return apiError('bad_request', 'End date must be on or after the start date.')
    }

    const db = adminDb()
    if (!(await ownsTrip(db, id, auth.user.profileId))) return apiError('forbidden')

    const { error } = await db
      .from('trips')
      .update({ ...toRow(input), updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return apiDbFailure('trips', error)
    return apiOk({ id })
  } catch (err) {
    return apiFailure('trips', err)
  }
}

/** DELETE /api/trips — 본인 여행 계획 삭제. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const parsed = await parseJsonBody(req, z.object({ id: z.string().uuid() }))
    if ('response' in parsed) return parsed.response

    const db = adminDb()
    if (!(await ownsTrip(db, parsed.data.id, auth.user.profileId))) return apiError('forbidden')

    const { error } = await db.from('trips').delete().eq('id', parsed.data.id)
    if (error) return apiDbFailure('trips', error)

    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('trips', err)
  }
}
