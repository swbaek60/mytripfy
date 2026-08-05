import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { isChatParticipant } from '@/lib/api/ownership'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
})

/**
 * DELETE /api/group-chat/members
 *
 * 그룹 채팅에서 멤버를 내보낸다. 해당 모집글의 호스트만 호출할 수 있고,
 * 호스트 자신은 내보낼 수 없다 (나가기는 /api/messages/leave 를 쓴다).
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'group-chat:members', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { chatId, userId } = parsed.data

    if (userId === auth.user.profileId) {
      return apiError('bad_request', 'Use leave instead of removing yourself.')
    }

    const db = adminDb()

    const { data: chat } = await db
      .from('chats')
      .select('id, created_by, reference_id, is_group')
      .eq('id', chatId)
      .maybeSingle()

    if (!chat || !chat.is_group) return apiError('not_found', 'Group chat not found.')

    // 방을 만든 사람 또는 연결된 모집글의 호스트만 멤버를 내보낼 수 있다.
    let isHost = chat.created_by === auth.user.profileId
    if (!isHost && chat.reference_id) {
      const { data: post } = await db
        .from('companion_posts')
        .select('user_id')
        .eq('id', chat.reference_id)
        .maybeSingle()
      isHost = post?.user_id === auth.user.profileId
    }

    if (!isHost) return apiError('forbidden', 'Only the trip host can remove members.')
    if (!(await isChatParticipant(db, chatId, userId))) {
      return apiError('not_found', 'That member is not in this chat.')
    }

    const { error } = await db
      .from('chat_participants')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId)

    if (error) return apiDbFailure('group-chat/members', error)
    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('group-chat/members', err)
  }
}
