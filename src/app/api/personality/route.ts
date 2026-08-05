import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PERSONALITY_TYPES } from '@/data/personalityTypes'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

const bodySchema = z.object({
  personalityType: z.string().min(1).max(60),
  answers: z.record(z.string().max(40), z.string().max(40)).optional(),
})

/**
 * 여행 성향 테스트 결과를 저장한다.
 *
 * 성향 타입과 설명은 서버의 정의 테이블에서 가져오므로 클라이언트가 임의의
 * 설명 텍스트를 심을 수 없다.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'personality', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { personalityType, answers } = parsed.data

    const definition = PERSONALITY_TYPES[personalityType]
    if (!definition) return apiError('bad_request', 'Unknown personality type.')

    const { error } = await adminDb().from('travel_personalities').upsert({
      id: auth.user.profileId,
      personality_type: personalityType,
      personality_desc: definition.desc,
      scores: answers ?? {},
      updated_at: new Date().toISOString(),
    })

    if (error) return apiDbFailure('personality', error)
    return apiOk({ success: true, personalityType })
  } catch (err) {
    return apiFailure('personality', err)
  }
}
