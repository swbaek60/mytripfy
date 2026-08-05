import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  appId: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'rejected', 'removed']),
})

/**
 * 동행 신청을 수락/거절하거나 수락된 멤버를 내보낸다. 게시물 호스트만 호출할 수 있다.
 *
 * 신청서가 실제로 그 게시물에 속하는지 서버에서 다시 조회하므로,
 * 다른 게시물의 신청서 ID 를 끼워 넣어 상태를 바꾸는 것은 불가능하다.
 * 그룹 채팅방 ID 도 클라이언트 값이 아니라 게시물 레코드에서 가져온다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'companion:application-status', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { appId, status } = parsed.data

    const db = adminDb()

    const { data: application } = await db
      .from('companion_applications')
      .select('id, post_id, applicant_id')
      .eq('id', appId)
      .maybeSingle()

    if (!application) return apiError('not_found', 'Application not found.')

    const { data: post } = await db
      .from('companion_posts')
      .select('user_id, group_chat_id, title')
      .eq('id', application.post_id)
      .maybeSingle()

    if (!post) return apiError('not_found', 'Trip not found.')
    if (post.user_id !== auth.user.profileId) {
      return apiError('forbidden', 'Only the trip host can change application status.')
    }

    const { error: updateError } = await db
      .from('companion_applications')
      .update({ status })
      .eq('id', appId)

    if (updateError) return apiDbFailure('companion/application-status', updateError)

    const groupChatId = post.group_chat_id as string | null
    if (groupChatId) {
      if (status === 'accepted') {
        await db
          .from('chat_participants')
          .upsert({ chat_id: groupChatId, user_id: application.applicant_id })
      } else {
        await db
          .from('chat_participants')
          .delete()
          .eq('chat_id', groupChatId)
          .eq('user_id', application.applicant_id)
      }
    }

    // 강제 퇴출은 별도 알림을 남긴다 (수락/거절은 DB 트리거가 처리).
    if (status === 'removed') {
      await db.from('notifications').insert({
        user_id: application.applicant_id,
        type: 'companion',
        title: '🚫 Removed from trip',
        message: `You have been removed from "${post.title}". You may re-apply if you wish.`,
        reference_id: application.post_id,
        reference_type: 'companion_post',
      })
    }

    return apiOk({
      success: true,
      postId: application.post_id,
      applicantId: application.applicant_id,
    })
  } catch (err) {
    return apiFailure('companion/application-status', err)
  }
}
