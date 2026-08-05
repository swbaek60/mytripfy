import { decodeHtmlEntities } from './google-translate'
import { guessSourceLang } from './detect-language'

/**
 * MyMemory 무료 번역 (Google Translation API 폴백).
 *
 * 키가 필요 없어 과금이 끊겨도 채팅 번역이 살아 있게 해 준다. 대신 제약이 많다.
 *  - 한 요청당 500자 제한 → 문장 경계로 잘라 이어 붙인다.
 *  - `langpair` 에 원문 언어가 필수이고 `auto` 를 거부한다 → 문자 체계로 추정한다.
 *  - 익명 호출은 일일 총량이 낮다. `MYMEMORY_CONTACT_EMAIL` 을 설정하면 한도가 올라간다.
 *
 * 품질은 Google 보다 낮으므로 어디까지나 폴백이다.
 */

const MAX_CHUNK = 450

/** 500자 제한에 맞춰 문장 경계 우선으로 자른다. */
function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text]

  const chunks: string[] = []
  let rest = text
  while (rest.length > MAX_CHUNK) {
    const window = rest.slice(0, MAX_CHUNK)
    // 문장 끝 → 공백 → 어쩔 수 없으면 글자 수 기준
    const breakAt =
      Math.max(
        window.lastIndexOf('. '),
        window.lastIndexOf('! '),
        window.lastIndexOf('? '),
        window.lastIndexOf('\n')
      ) + 1 || window.lastIndexOf(' ') + 1 || MAX_CHUNK
    chunks.push(rest.slice(0, breakAt).trim())
    rest = rest.slice(breakAt)
  }
  if (rest.trim()) chunks.push(rest.trim())
  return chunks
}

function toMyMemoryLang(locale: string): string {
  if (locale === 'zh') return 'zh-CN'
  if (locale === 'zh-TW') return 'zh-TW'
  if (locale === 'pt-BR') return 'pt-BR'
  return locale
}

async function translateChunk(chunk: string, source: string, target: string): Promise<string> {
  const params = new URLSearchParams({ q: chunk, langpair: `${source}|${target}` })
  const contact = process.env.MYMEMORY_CONTACT_EMAIL
  if (contact) params.set('de', contact)

  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
    // 폴백이 느리게 매달려 있으면 채팅 UI 가 멈춘 것처럼 보인다.
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)

  const data = await res.json()
  // 이 API 는 오류도 HTTP 200 으로 주고 responseStatus 에 실제 코드를 담는다.
  const status = Number(data?.responseStatus)
  if (status !== 200) {
    throw new Error(`MyMemory ${status}: ${String(data?.responseDetails ?? 'unknown error')}`)
  }
  const translated = data?.responseData?.translatedText
  if (typeof translated !== 'string' || !translated) throw new Error('MyMemory returned no text')
  return decodeHtmlEntities(translated)
}

/**
 * 원문을 대상 언어로 번역한다. 추정한 원문 언어가 대상 언어와 같으면
 * 외부 호출 없이 원문을 그대로 돌려준다.
 */
export async function translateWithMyMemory(text: string, targetLang: string): Promise<string> {
  const source = guessSourceLang(text)
  const target = toMyMemoryLang(targetLang)
  if (source === target.split('-')[0]) return text

  const chunks = chunkText(text)
  const results: string[] = []
  for (const chunk of chunks) {
    results.push(await translateChunk(chunk, source, target))
  }
  return results.join(' ')
}
