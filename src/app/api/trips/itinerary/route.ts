import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

type Db = ReturnType<typeof adminDb>

const CATEGORIES = ['transport', 'accommodation', 'meal', 'activity', 'note'] as const

const ownerRef = z
  .object({
    tripId: z.string().uuid().optional(),
    postId: z.string().uuid().optional(),
  })
  .refine((v) => Boolean(v.tripId) !== Boolean(v.postId), {
    message: 'Provide exactly one of tripId or postId',
  })

const createDaySchema = ownerRef.and(
  z.object({
    scope: z.literal('day'),
    dayNumber: z.number().int().min(1).max(365),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    title: z.string().trim().max(120).nullish(),
  })
)

const createActivitySchema = z.object({
  scope: z.literal('activity'),
  dayId: z.string().uuid(),
  category: z.enum(CATEGORIES).default('activity'),
  title: z.string().trim().min(1).max(200).default('New activity'),
  currency: z.string().trim().length(3).default('USD'),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

const updateDaySchema = z.object({
  scope: z.literal('day'),
  dayId: z.string().uuid(),
  title: z.string().trim().max(120).nullish(),
  notes: z.string().trim().max(2000).nullish(),
})

const updateActivitySchema = z.object({
  scope: z.literal('activity'),
  activityId: z.string().uuid(),
  category: z.enum(CATEGORIES).optional(),
  timeLabel: z.string().trim().max(30).nullish(),
  title: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).nullish(),
  notes: z.string().trim().max(2000).nullish(),
  cost: z.number().min(0).max(100_000_000).nullish(),
  currency: z.string().trim().length(3).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

const deleteSchema = z.union([
  z.object({ scope: z.literal('day'), dayId: z.string().uuid() }),
  z.object({ scope: z.literal('activity'), activityId: z.string().uuid() }),
])

/** 여행 계획 또는 동행 모집글의 소유자를 확인한다. */
async function canEditItinerary(
  db: Db,
  ref: { tripId?: string; postId?: string },
  profileId: string
): Promise<boolean> {
  if (ref.tripId) {
    const { data } = await db.from('trips').select('user_id').eq('id', ref.tripId).maybeSingle()
    return data?.user_id === profileId
  }
  if (ref.postId) {
    const { data } = await db
      .from('companion_posts')
      .select('user_id')
      .eq('id', ref.postId)
      .maybeSingle()
    return data?.user_id === profileId
  }
  return false
}

/** 특정 일자(day)가 요청자 소유의 일정에 속하는지 확인한다. */
async function canEditDay(db: Db, dayId: string, profileId: string): Promise<boolean> {
  const { data: day } = await db
    .from('trip_days')
    .select('trip_id, post_id')
    .eq('id', dayId)
    .maybeSingle()
  if (!day) return false
  return canEditItinerary(
    db,
    { tripId: day.trip_id ?? undefined, postId: day.post_id ?? undefined },
    profileId
  )
}

async function canEditActivity(db: Db, activityId: string, profileId: string): Promise<boolean> {
  const { data } = await db.from('trip_activities').select('day_id').eq('id', activityId).maybeSingle()
  if (!data) return false
  return canEditDay(db, data.day_id, profileId)
}

/** POST /api/trips/itinerary — 일자 또는 활동을 추가한다. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'trips:itinerary', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, z.union([createDaySchema, createActivitySchema]))
    if ('response' in parsed) return parsed.response
    const body = parsed.data
    const db = adminDb()

    if (body.scope === 'day') {
      const ref = { tripId: body.tripId, postId: body.postId }
      if (!(await canEditItinerary(db, ref, auth.user.profileId))) return apiError('forbidden')

      const { data, error } = await db
        .from('trip_days')
        .insert({
          ...(ref.tripId ? { trip_id: ref.tripId } : { post_id: ref.postId }),
          day_number: body.dayNumber,
          date: body.date || null,
          title: body.title || `Day ${body.dayNumber}`,
        })
        .select('id, day_number, date, title, notes')
        .single()

      if (error || !data) return apiDbFailure('trips/itinerary', error)
      return apiOk({ day: { ...data, trip_activities: [] } }, { status: 201 })
    }

    if (!(await canEditDay(db, body.dayId, auth.user.profileId))) return apiError('forbidden')

    const sortOrder =
      body.sortOrder ??
      (await db
        .from('trip_activities')
        .select('id', { count: 'exact', head: true })
        .eq('day_id', body.dayId)
        .then(({ count }) => count ?? 0))

    const { data, error } = await db
      .from('trip_activities')
      .insert({
        day_id: body.dayId,
        sort_order: sortOrder,
        category: body.category,
        title: body.title,
        currency: body.currency.toUpperCase(),
      })
      .select('id, sort_order, time_label, category, title, location, notes, cost, currency')
      .single()

    if (error || !data) return apiDbFailure('trips/itinerary', error)
    return apiOk({ activity: data }, { status: 201 })
  } catch (err) {
    return apiFailure('trips/itinerary', err)
  }
}

/** PATCH /api/trips/itinerary — 일자 또는 활동을 수정한다. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'trips:itinerary', auth.user.profileId, RATE_LIMITS.autosave)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, z.union([updateDaySchema, updateActivitySchema]))
    if ('response' in parsed) return parsed.response
    const body = parsed.data
    const db = adminDb()

    if (body.scope === 'day') {
      if (!(await canEditDay(db, body.dayId, auth.user.profileId))) return apiError('forbidden')

      const patch: Record<string, unknown> = {}
      if (body.title !== undefined) patch.title = body.title || null
      if (body.notes !== undefined) patch.notes = body.notes || null
      if (!Object.keys(patch).length) return apiOk({ updated: false })

      const { error } = await db.from('trip_days').update(patch).eq('id', body.dayId)
      if (error) return apiDbFailure('trips/itinerary', error)
      return apiOk({ updated: true })
    }

    if (!(await canEditActivity(db, body.activityId, auth.user.profileId))) {
      return apiError('forbidden')
    }

    const patch: Record<string, unknown> = {}
    if (body.category !== undefined) patch.category = body.category
    if (body.timeLabel !== undefined) patch.time_label = body.timeLabel || null
    if (body.title !== undefined) patch.title = body.title
    if (body.location !== undefined) patch.location = body.location || null
    if (body.notes !== undefined) patch.notes = body.notes || null
    if (body.cost !== undefined) patch.cost = body.cost ?? null
    if (body.currency !== undefined) patch.currency = body.currency.toUpperCase()
    if (body.sortOrder !== undefined) patch.sort_order = body.sortOrder
    if (!Object.keys(patch).length) return apiOk({ updated: false })

    const { error } = await db.from('trip_activities').update(patch).eq('id', body.activityId)
    if (error) return apiDbFailure('trips/itinerary', error)
    return apiOk({ updated: true })
  } catch (err) {
    return apiFailure('trips/itinerary', err)
  }
}

/** DELETE /api/trips/itinerary — 일자 또는 활동을 삭제한다. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const parsed = await parseJsonBody(req, deleteSchema)
    if ('response' in parsed) return parsed.response
    const body = parsed.data
    const db = adminDb()

    if (body.scope === 'day') {
      if (!(await canEditDay(db, body.dayId, auth.user.profileId))) return apiError('forbidden')
      const { error } = await db.from('trip_days').delete().eq('id', body.dayId)
      if (error) return apiDbFailure('trips/itinerary', error)
    } else {
      if (!(await canEditActivity(db, body.activityId, auth.user.profileId))) {
        return apiError('forbidden')
      }
      const { error } = await db.from('trip_activities').delete().eq('id', body.activityId)
      if (error) return apiDbFailure('trips/itinerary', error)
    }

    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('trips/itinerary', err)
  }
}
