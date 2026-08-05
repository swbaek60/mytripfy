import { translateText } from './google-translate'
import { translateWithMyMemory } from './mymemory'

export type TranslationProvider = 'google' | 'mymemory'

export interface TranslationResult {
  text: string
  provider: TranslationProvider
}

/**
 * 번역 제공자 체인.
 *
 * Google Cloud Translation 을 우선 쓰고, 키가 없거나 호출이 실패하면 무료
 * MyMemory 로 넘어간다. 예전에는 Google 한 곳만 썼기 때문에 프로젝트 과금이
 * 끊긴 순간(403 userRateLimitExceeded) 채팅 번역이 통째로 죽었다. 품질은 Google 이
 * 낫지만, 번역 버튼이 아무 반응도 하지 않는 것보다는 폴백이 낫다.
 *
 * 어느 제공자를 썼는지 함께 돌려주므로, 캐시에 기록해 두면 나중에 Google 이
 * 복구된 뒤 낮은 품질의 항목만 골라 다시 번역할 수 있다.
 */
export async function translateWithFallback(
  text: string,
  targetLang: string
): Promise<TranslationResult> {
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY

  if (apiKey) {
    try {
      return { text: await translateText(apiKey, text, targetLang), provider: 'google' }
    } catch (err) {
      console.error('[translate] Google 실패, MyMemory 로 폴백:', err)
    }
  }

  return { text: await translateWithMyMemory(text, targetLang), provider: 'mymemory' }
}
