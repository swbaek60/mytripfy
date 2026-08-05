import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, parseSearchParams, requireUser } from '@/lib/api/guard'
import { RATE_LIMITS } from '@/lib/api/rate-limit'
import { isChatParticipant } from '@/lib/api/ownership'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const MESSAGE_LIMIT = 100

const querySchema = z.object({ chatId: z.string().uuid() })

const readSchema = z.object({
  chatId: z.string().uuid(),
  /** 1:1 대화에서 상대 사용자의 메시지 알림까지 읽음 처리할 때 사용한다. */
  peerId: z.string().uuid().optional(),
})

/**
 * GET /api/messages/sync?chatId=xxx
 *
 * 채팅방 한 곳의 메시지·참여자 읽음 상태·발신자 프로필을 한 번에 반환한다.
 * 브라우저가 Supabase 를 직접 구독하지 않고 이 엔드포인트만 폴링하도록 해서,
 * 익명 DB 접근 없이도 대화가 갱신된다.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const parsed = parseSearchParams(req, querySchema)
    if ('response' in parsed) return parsed.response
    const { chatId } = parsed.data

    const db = adminDb()
    if (!(await isChatParticipant(db, chatId, auth.user.profileId))) {
      return apiError('forbidden', 'You are not a member of this chat.')
    }

    const [messagesRes, participantsRes] = await Promise.all([
      db
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(MESSAGE_LIMIT),
      db.from('chat_participants').select('user_id, last_read_at').eq('chat_id', chatId),
    ])

    if (messagesRes.error) return apiDbFailure('messages/sync', messagesRes.error)

    const messages = messagesRes.data ?? []
    const senderIds = [...new Set(messages.map((m) => m.sender_id))]

    const { data: profiles } = senderIds.length
      ? await db.from('profiles').select('id, full_name, avatar_url').in('id', senderIds)
      : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }

    return apiOk({
      messages,
      participants: participantsRes.data ?? [],
      senders: profiles ?? [],
    })
  } catch (err) {
    return apiFailure('messages/sync', err)
  }
}

/**
 * POST /api/messages/sync
 * 채팅방 입장/열람 시 읽음 처리를 한다 (last_read_at + 메시지 알림).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'messages:read', auth.user.profileId, RATE_LIMITS.autosave)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, readSchema)
    if ('response' in parsed) return parsed.response
    const { chatId, peerId } = parsed.data

    const db = adminDb()
    if (!(await isChatParticipant(db, chatId, auth.user.profileId))) {
      return apiError('forbidden', 'You are not a member of this chat.')
    }

    const now = new Date().toISOString()
    const tasks: PromiseLike<unknown>[] = [
      db
        .from('chat_participants')
        .update({ last_read_at: now })
        .eq('chat_id', chatId)
        .eq('user_id', auth.user.profileId),
    ]

    const notifications = db
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', auth.user.profileId)
      .eq('type', 'message')
      .eq('is_read', false)

    tasks.push(
      peerId
        ? notifications.eq('reference_type', 'user').eq('reference_id', peerId)
        : notifications.eq('reference_id', chatId)
    )

    await Promise.all(tasks)
    return apiOk({ lastReadAt: now })
  } catch (err) {
    return apiFailure('messages/sync', err)
  }
}
