import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { translateWithFallback, type TranslationResult } from '@/lib/translate/translate'
import { routing } from '@/i18n/routing'
import { adminDb, enforceRateLimit, parseJsonBody } from '@/lib/api/guard'
import { getAuthUser } from '@/utils/supabase/server'
import { apiError, apiFailure, apiOk } from '@/lib/api/respond'

/** 유료 번역 API 남용 방지: 한 번에 번역할 수 있는 최대 길이 */
const MAX_TEXT_LENGTH = 5000

// 지원 로케일 전체를 대상으로 허용한다 (채팅 번역은 영어로도 요청된다).
const targetLangs = [...routing.locales] as [string, ...string[]]

const bodySchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
  targetLang: z.enum(targetLangs),
})

function hashText(text: string): string {
  return createHash('md5').update(text).digest('hex')
}

/**
 * UGC 번역. 캐시 조회는 누구나 가능하지만, 실제 유료 API 호출은
 * 로그인 여부에 따라 서로 다른 rate limit 을 적용한다.
 *
 * 비로그인은 IP 기준으로 훨씬 낮은 한도를 쓰므로, 공개 페이지의 정상적인 번역은
 * 유지되면서 대량 호출로 비용을 소진시키는 것은 막힌다.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const { text, targetLang } = parsed.data

    const sourceHash = hashText(text)
    const db = adminDb()

    const { data: cached } = await db
      .from('ugc_translations')
      .select('translated_text, provider')
      .eq('source_hash', sourceHash)
      .eq('target_lang', targetLang)
      .maybeSingle()

    if (cached?.translated_text) {
      return apiOk({
        translatedText: cached.translated_text,
        cached: true,
        provider: cached.provider ?? 'google',
      })
    }

    // 캐시 미스 = 유료 호출. 여기서만 한도를 적용한다.
    const user = await getAuthUser()
    const limited = enforceRateLimit(
      req,
      'translate',
      user?.profileId ?? null,
      user ? { limit: 60, windowMs: 60_000 } : { limit: 10, windowMs: 60_000 }
    )
    if (limited) return limited.response

    let result: TranslationResult
    try {
      result = await translateWithFallback(text, targetLang)
    } catch (err) {
      // 모든 제공자가 실패한 경우다. 원인은 로그로만 남기고 클라이언트에는
      // 재시도 가능한 상태임을 알린다.
      console.error('[translate] 모든 제공자 실패:', err)
      return apiError('unavailable', 'Translation is not available right now.')
    }

    // 캐시 쓰기 실패는 번역 자체를 막을 이유가 없지만, 조용히 넘기면 안 된다.
    // 실제로 권한 문제로 캐시가 통째로 비어 있던 적이 있고, 그동안 같은 문장마다
    // 외부 번역 API 를 다시 호출하고 있었다.
    const { error: cacheError } = await db.from('ugc_translations').upsert(
      {
        source_hash: sourceHash,
        target_lang: targetLang,
        translated_text: result.text,
        provider: result.provider,
      },
      { onConflict: 'source_hash,target_lang' }
    )
    if (cacheError) console.error('[translate] 캐시 저장 실패:', cacheError)

    return apiOk({ translatedText: result.text, cached: false, provider: result.provider })
  } catch (err) {
    return apiFailure('translate', err)
  }
}
