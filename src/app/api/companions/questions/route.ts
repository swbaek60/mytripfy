import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const askSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().trim().min(1).max(1000),
})

const answerSchema = z.object({
  questionId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
})

/** POST /api/companions/questions — 모집글에 질문을 남긴다 (호스트 제외). */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'companions:questions', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, askSchema)
    if ('response' in parsed) return parsed.response
    const { postId, content } = parsed.data

    const db = adminDb()
    const { data: post } = await db
      .from('companion_posts')
      .select('user_id')
      .eq('id', postId)
      .maybeSingle()

    if (!post) return apiError('not_found', 'Trip not found.')
    if (post.user_id === auth.user.profileId) {
      return apiError('bad_request', 'Hosts answer questions instead of asking them.')
    }

    // 질문자·호스트 알림은 DB 트리거(notify_on_new_question)가 보낸다.
    const { data, error } = await db
      .from('companion_questions')
      .insert({
        post_id: postId,
        question_user_id: auth.user.profileId,
        question_content: content,
      })
      .select('id, question_content, question_created_at, question_user_id')
      .single()

    if (error || !data) return apiDbFailure('companions/questions', error)
    return apiOk({ question: data }, { status: 201 })
  } catch (err) {
    return apiFailure('companions/questions', err)
  }
}

/** PATCH /api/companions/questions — 호스트만 답변할 수 있다. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'companions:answers', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, answerSchema)
    if ('response' in parsed) return parsed.response
    const { questionId, content } = parsed.data

    const db = adminDb()
    const { data: question } = await db
      .from('companion_questions')
      .select('id, post_id')
      .eq('id', questionId)
      .maybeSingle()

    if (!question) return apiError('not_found', 'Question not found.')

    const { data: post } = await db
      .from('companion_posts')
      .select('user_id')
      .eq('id', question.post_id)
      .maybeSingle()

    if (post?.user_id !== auth.user.profileId) return apiError('forbidden')

    const { data, error } = await db
      .from('companion_questions')
      .update({
        answer_user_id: auth.user.profileId,
        answer_content: content,
        answer_created_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select('id, answer_content, answer_created_at')
      .single()

    if (error || !data) return apiDbFailure('companions/questions', error)
    return apiOk({ question: data })
  } catch (err) {
    return apiFailure('companions/questions', err)
  }
}
