/** Google Cloud Translation API v2 target locale mapping */
export function toGoogleTargetLang(locale: string): string {
  if (locale === 'zh') return 'zh-CN'
  return locale
}

export function decodeHtmlEntities(text: string): string {
  if (!text) return text
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export async function translateText(
  apiKey: string,
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  const apiTarget = toGoogleTargetLang(targetLang)
  const body: Record<string, string | string[]> = {
    q: text,
    target: apiTarget,
  }
  if (sourceLang) body.source = sourceLang

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Translate API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const translated = data?.data?.translations?.[0]?.translatedText
  if (!translated) throw new Error('No translation returned')
  return decodeHtmlEntities(translated)
}
