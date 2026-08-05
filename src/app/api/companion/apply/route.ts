import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'
import { sendEmail } from '@/utils/email'
import { companionApplicationEmail } from '@/utils/emailTemplates'
import { notifyCompanionApplication } from '@/utils/push'

const applySchema = z.object({
  postId: z.string().uuid(),
  message: z.string().trim().max(2000).nullish(),
})

const cancelSchema = z.object({ postId: z.string().uuid() })

/**
 * 동행 신청. 성별 조건을 검사한 뒤 저장하고, 호스트에게 푸시·메일로 알린다.
 * 알림 실패는 신청 자체를 되돌리지 않는다.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'companion:apply', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, applySchema)
    if ('response' in parsed) return parsed.response
    const { postId, message } = parsed.data

    const db = adminDb()

    const { data: post } = await db
      .from('companion_posts')
      .select('id, gender_preference, status, title, user_id')
      .eq('id', postId)
      .maybeSingle()

    if (!post) return apiError('not_found', 'Trip not found.')
    if (post.user_id === auth.user.profileId) {
      return apiError('bad_request', 'You cannot apply to your own trip.')
    }
    if (post.status !== 'open') {
      return apiError('bad_request', 'This trip is no longer open for applications.')
    }

    const pref = post.gender_preference as string
    if (pref === 'female_only' || pref === 'male_only') {
      const { data: profile } = await db
        .from('profiles')
        .select('gender')
        .eq('id', auth.user.profileId)
        .maybeSingle()
      const allowed =
        (pref === 'female_only' && profile?.gender === 'female') ||
        (pref === 'male_only' && profile?.gender === 'male')
      if (!allowed) {
        return apiError(
          'forbidden',
          pref === 'female_only' ? 'This trip is for women only.' : 'This trip is for men only.'
        )
      }
    }

    const { error } = await db.from('companion_applications').upsert(
      { post_id: postId, applicant_id: auth.user.profileId, message: message || null, status: 'pending' },
      { onConflict: 'post_id,applicant_id' }
    )

    if (error) return apiDbFailure('companion/apply', error)

    await notifyHost(db, {
      hostId: post.user_id,
      postId: post.id,
      postTitle: post.title ?? 'Companion trip',
      applicantId: auth.user.profileId,
      message: message || undefined,
    })

    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('companion/apply', err)
  }
}

/** 본인이 낸 신청을 취소한다. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const parsed = await parseJsonBody(req, cancelSchema)
    if ('response' in parsed) return parsed.response

    const { error } = await adminDb()
      .from('companion_applications')
      .delete()
      .eq('post_id', parsed.data.postId)
      .eq('applicant_id', auth.user.profileId)

    if (error) return apiDbFailure('companion/apply', error)
    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('companion/apply', err)
  }
}

async function notifyHost(
  db: ReturnType<typeof adminDb>,
  params: {
    hostId: string
    postId: string
    postTitle: string
    applicantId: string
    message?: string
  }
) {
  try {
    const [{ data: applicant }, { data: host }] = await Promise.all([
      db.from('profiles').select('full_name, avatar_url').eq('id', params.applicantId).maybeSingle(),
      db.from('profiles').select('full_name, email').eq('id', params.hostId).maybeSingle(),
    ])

    const applicantName = applicant?.full_name ?? 'A traveler'

    await notifyCompanionApplication({
      hostId: params.hostId,
      postId: params.postId,
      postTitle: params.postTitle,
      applicantName,
    })

    if (host?.email) {
      const { subject, html } = companionApplicationEmail({
        hostName: host.full_name || 'Host',
        applicantName,
        applicantAvatarUrl: applicant?.avatar_url || undefined,
        postTitle: params.postTitle,
        postId: params.postId,
        message: params.message,
        locale: process.env.DEFAULT_LOCALE || 'en',
      })
      await sendEmail({ to: host.email, subject, html })
    }
  } catch (err) {
    console.error('[api/companion/apply] notify failed:', err)
  }
}
