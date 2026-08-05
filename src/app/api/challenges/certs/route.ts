import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, parseSearchParams, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'
import { isOwnedPath, storagePathFromPublicUrl } from '@/lib/api/storage'

const CERT_BUCKET = 'certifications'

const createSchema = z.object({
  challengeId: z.string().uuid(),
  imageUrl: z.string().url().max(600),
})

const deleteSchema = z.object({
  challenge_id: z.string().uuid().optional(),
  challengeId: z.string().uuid().optional(),
})

const listSchema = z.object({
  challengeId: z.string().uuid(),
})

/**
 * POST /api/challenges/certs
 * 챌린지 인증을 등록한다. `imageUrl` 은 반드시 본인 폴더에 업로드된
 * certifications 버킷 URL 이어야 한다 (임의 외부 URL 주입 방지).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'challenges:certs', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, createSchema)
    if ('response' in parsed) return parsed.response
    const { challengeId, imageUrl } = parsed.data

    const storagePath = storagePathFromPublicUrl(CERT_BUCKET, imageUrl)
    if (!storagePath || !isOwnedPath(storagePath, auth.user.profileId)) {
      return apiError('bad_request', 'Certification image must be uploaded first.')
    }

    const db = adminDb()

    const { data: challenge } = await db
      .from('challenges')
      .select('id')
      .eq('id', challengeId)
      .maybeSingle()
    if (!challenge) return apiError('not_found', 'Challenge not found.')

    const { error } = await db.from('challenge_certifications').insert({
      user_id: auth.user.profileId,
      challenge_id: challengeId,
      image_url: imageUrl,
    })

    if (error) return apiDbFailure('challenges/certs', error)
    return apiOk({ success: true, challengeId, imageUrl }, { status: 201 })
  } catch (err) {
    return apiFailure('challenges/certs', err)
  }
}

/** DELETE /api/challenges/certs — 본인 인증만 삭제한다. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const parsed = await parseJsonBody(req, deleteSchema)
    if ('response' in parsed) return parsed.response

    const challengeId = parsed.data.challenge_id ?? parsed.data.challengeId
    if (!challengeId) return apiError('bad_request', 'challengeId is required.')

    const { error } = await adminDb()
      .from('challenge_certifications')
      .delete()
      .eq('user_id', auth.user.profileId)
      .eq('challenge_id', challengeId)

    if (error) return apiDbFailure('challenges/certs', error)
    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('challenges/certs', err)
  }
}

/**
 * GET /api/challenges/certs?challengeId=xxx
 * 해당 챌린지의 공개 인증 목록. 이름·아바타 등 공개 프로필 필드만 반환한다.
 */
export async function GET(req: NextRequest) {
  try {
    const parsed = parseSearchParams(req, listSchema)
    if ('response' in parsed) return parsed.response
    const { challengeId } = parsed.data

    const db = adminDb()
    const { data: certs, error } = await db
      .from('challenge_certifications')
      .select('user_id, challenge_id, image_url, created_at, dispute_status')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false })

    if (error) return apiDbFailure('challenges/certs', error)

    const list = certs ?? []
    if (!list.length) return apiOk({ data: [] })

    const userIds = [...new Set(list.map((cert) => cert.user_id))]
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    return apiOk({
      data: list.map((cert) => ({
        user_id: cert.user_id,
        challenge_id: cert.challenge_id,
        image_url: cert.image_url,
        created_at: cert.created_at,
        dispute_status: cert.dispute_status || 'clean',
        full_name: profileMap.get(cert.user_id)?.full_name ?? 'User',
        avatar_url: profileMap.get(cert.user_id)?.avatar_url ?? null,
      })),
    })
  } catch (err) {
    return apiFailure('challenges/certs', err)
  }
}
