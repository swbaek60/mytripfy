import { adminDb } from '@/lib/api/guard'

/**
 * 소유권 / 멤버십 검증 헬퍼.
 *
 * 서비스 롤 클라이언트는 RLS 를 우회하므로, 데이터를 읽거나 쓰기 전에
 * 반드시 이 헬퍼로 "요청자가 해당 행에 접근할 자격이 있는지"를 확인한다.
 */

type Db = ReturnType<typeof adminDb>

async function ownsRow(
  db: Db,
  table: string,
  id: string,
  profileId: string,
  ownerColumn = 'user_id'
): Promise<boolean> {
  const { data } = await db.from(table).select(ownerColumn).eq('id', id).maybeSingle()
  if (!data) return false
  return (data as unknown as Record<string, unknown>)[ownerColumn] === profileId
}

export function ownsCompanionPost(db: Db, postId: string, profileId: string) {
  return ownsRow(db, 'companion_posts', postId, profileId)
}

export function ownsGuideRequest(db: Db, requestId: string, profileId: string) {
  return ownsRow(db, 'guide_requests', requestId, profileId)
}

export function ownsTrip(db: Db, tripId: string, profileId: string) {
  return ownsRow(db, 'trips', tripId, profileId)
}

export function ownsSponsor(db: Db, sponsorId: string, profileId: string) {
  return ownsRow(db, 'sponsors', sponsorId, profileId)
}

/** 요청자가 해당 채팅방의 참가자인지 확인한다. */
export async function isChatParticipant(
  db: Db,
  chatId: string,
  profileId: string
): Promise<boolean> {
  const { data } = await db
    .from('chat_participants')
    .select('user_id')
    .eq('chat_id', chatId)
    .eq('user_id', profileId)
    .maybeSingle()
  return Boolean(data)
}

/**
 * 동행 신청서에 접근할 자격을 확인한다.
 * 신청자 본인이거나, 해당 게시물의 호스트여야 한다.
 */
export async function resolveApplicationAccess(
  db: Db,
  applicationId: string,
  profileId: string
): Promise<
  | { ok: true; role: 'applicant' | 'host'; postId: string; applicantId: string }
  | { ok: false; reason: 'not_found' | 'forbidden' }
> {
  const { data: application } = await db
    .from('companion_applications')
    .select('id, post_id, applicant_id')
    .eq('id', applicationId)
    .maybeSingle()

  if (!application) return { ok: false, reason: 'not_found' }

  if (application.applicant_id === profileId) {
    return {
      ok: true,
      role: 'applicant',
      postId: application.post_id,
      applicantId: application.applicant_id,
    }
  }

  const { data: post } = await db
    .from('companion_posts')
    .select('user_id')
    .eq('id', application.post_id)
    .maybeSingle()

  if (post?.user_id === profileId) {
    return {
      ok: true,
      role: 'host',
      postId: application.post_id,
      applicantId: application.applicant_id,
    }
  }

  return { ok: false, reason: 'forbidden' }
}

/**
 * 가이드 지원서에 접근할 자격을 확인한다.
 * 지원한 가이드 본인이거나, 해당 요청의 작성자여야 한다.
 */
export async function resolveGuideApplicationAccess(
  db: Db,
  applicationId: string,
  profileId: string
): Promise<
  | { ok: true; role: 'guide' | 'requester'; requestId: string; guideId: string }
  | { ok: false; reason: 'not_found' | 'forbidden' }
> {
  const { data: application } = await db
    .from('guide_applications')
    .select('id, request_id, guide_id')
    .eq('id', applicationId)
    .maybeSingle()

  if (!application) return { ok: false, reason: 'not_found' }

  if (application.guide_id === profileId) {
    return { ok: true, role: 'guide', requestId: application.request_id, guideId: application.guide_id }
  }

  const { data: request } = await db
    .from('guide_requests')
    .select('user_id')
    .eq('id', application.request_id)
    .maybeSingle()

  if (request?.user_id === profileId) {
    return {
      ok: true,
      role: 'requester',
      requestId: application.request_id,
      guideId: application.guide_id,
    }
  }

  return { ok: false, reason: 'forbidden' }
}
