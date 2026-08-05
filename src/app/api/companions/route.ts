import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { ownsCompanionPost } from '@/lib/api/ownership'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'
import { assertOwnedImageUrl } from '@/lib/api/image-url'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

const postFields = {
  title: z.string().trim().min(2).max(100),
  destinationCountry: z.string().trim().min(2).max(80),
  destinationCity: z.string().trim().max(300).nullish(),
  startDate: isoDate,
  endDate: isoDate,
  maxPeople: z.number().int().min(2).max(20),
  genderPreference: z.enum(['any', 'male_only', 'female_only']),
  purpose: z.enum([
    'tourism',
    'backpacking',
    'business',
    'food',
    'adventure',
    'culture',
    'photography',
    'volunteer',
    'other',
  ]),
  description: z.string().trim().max(4000).nullish(),
  coverImage: z.string().url().max(600).nullish(),
}

const createSchema = z.object(postFields)
const updateSchema = z.object({ id: z.string().uuid(), ...postFields })

type PostInput = z.infer<typeof createSchema>

function toRow(input: PostInput) {
  return {
    title: input.title,
    destination_country: input.destinationCountry,
    destination_city: input.destinationCity?.trim() || null,
    start_date: input.startDate,
    end_date: input.endDate,
    max_people: input.maxPeople,
    gender_preference: input.genderPreference,
    purpose: input.purpose,
    description: input.description?.trim() || null,
    cover_image: input.coverImage || null,
  }
}

function validateDates(input: PostInput) {
  if (input.endDate < input.startDate) {
    return apiError('bad_request', 'End date must be on or after the start date.')
  }
  return null
}

/** POST /api/companions — 동행 모집글 생성 + 그룹 채팅방 개설. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'companions:create', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, createSchema)
    if ('response' in parsed) return parsed.response

    const dateError = validateDates(parsed.data)
    if (dateError) return dateError

    const coverError = assertOwnedImageUrl('photos', parsed.data.coverImage, auth.user.profileId)
    if (coverError) return coverError

    const db = adminDb()
    const { data: post, error } = await db
      .from('companion_posts')
      .insert({ ...toRow(parsed.data), user_id: auth.user.profileId, status: 'open' })
      .select('id')
      .single()

    if (error || !post) return apiDbFailure('companions', error)

    // 모집글마다 그룹 채팅방을 만들고 호스트를 첫 참여자로 넣는다.
    const { data: chat } = await db
      .from('chats')
      .insert({
        type: 'trip_group',
        is_group: true,
        name: parsed.data.title,
        reference_id: post.id,
        created_by: auth.user.profileId,
      })
      .select('id')
      .single()

    if (chat) {
      await db.from('chat_participants').insert({ chat_id: chat.id, user_id: auth.user.profileId })
      await db.from('companion_posts').update({ group_chat_id: chat.id }).eq('id', post.id)
    }

    return apiOk({ id: post.id, groupChatId: chat?.id ?? null }, { status: 201 })
  } catch (err) {
    return apiFailure('companions', err)
  }
}

/** PATCH /api/companions — 본인 모집글 수정. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'companions:update', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, updateSchema)
    if ('response' in parsed) return parsed.response
    const { id, ...input } = parsed.data

    const dateError = validateDates(parsed.data)
    if (dateError) return dateError

    const coverError = assertOwnedImageUrl('photos', input.coverImage, auth.user.profileId)
    if (coverError) return coverError

    const db = adminDb()
    if (!(await ownsCompanionPost(db, id, auth.user.profileId))) {
      return apiError('forbidden')
    }

    const { error } = await db.from('companion_posts').update(toRow(input)).eq('id', id)
    if (error) return apiDbFailure('companions', error)

    // 채팅방 이름도 제목과 동기화한다.
    await db.from('chats').update({ name: input.title }).eq('reference_id', id).eq('type', 'trip_group')

    return apiOk({ id })
  } catch (err) {
    return apiFailure('companions', err)
  }
}

/** DELETE /api/companions — 본인 모집글 삭제. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const parsed = await parseJsonBody(req, z.object({ id: z.string().uuid() }))
    if ('response' in parsed) return parsed.response

    const db = adminDb()
    if (!(await ownsCompanionPost(db, parsed.data.id, auth.user.profileId))) {
      return apiError('forbidden')
    }

    const { error } = await db.from('companion_posts').delete().eq('id', parsed.data.id)
    if (error) return apiDbFailure('companions', error)

    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('companions', err)
  }
}
