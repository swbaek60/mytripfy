import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { assertOwnedImageUrl } from '@/lib/api/image-url'
import { apiDbFailure, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({ avatarUrl: z.string().url().max(600) })

/**
 * 아바타 이미지를 갱신한다.
 * 업로드 라우트를 거친 본인 폴더의 파일만 허용한다.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'profile:avatar', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response

    const invalid = assertOwnedImageUrl('avatars', parsed.data.avatarUrl, auth.user.profileId)
    if (invalid) return invalid

    const { error } = await adminDb()
      .from('profiles')
      .update({ avatar_url: parsed.data.avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', auth.user.profileId)

    if (error) return apiDbFailure('profile/avatar', error)
    return apiOk({ avatarUrl: parsed.data.avatarUrl })
  } catch (err) {
    return apiFailure('profile/avatar', err)
  }
}
