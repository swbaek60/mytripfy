import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { translateText } from '@/lib/translate/google-translate'

function hashText(text: string): string {
  return createHash('md5').update(text.trim()).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    if (!targetLang?.trim()) {
      return NextResponse.json({ error: 'Missing targetLang' }, { status: 400 })
    }
    if (targetLang === 'en') {
      return NextResponse.json({ error: 'English locale does not need translation' }, { status: 400 })
    }

    const trimmed = text.trim()
    const sourceHash = hashText(trimmed)
    const admin = createAdminClient()

    const { data: cached } = await admin
      .from('ugc_translations')
      .select('translated_text')
      .eq('source_hash', sourceHash)
      .eq('target_lang', targetLang)
      .maybeSingle()

    if (cached?.translated_text) {
      return NextResponse.json({
        translatedText: cached.translated_text,
        cached: true,
      })
    }

    const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Translation service not configured' }, { status: 503 })
    }

    const translatedText = await translateText(apiKey, trimmed, targetLang)

    await admin.from('ugc_translations').upsert(
      {
        source_hash: sourceHash,
        target_lang: targetLang,
        translated_text: translatedText,
      },
      { onConflict: 'source_hash,target_lang' }
    )

    return NextResponse.json({ translatedText, cached: false })
  } catch (err) {
    console.error('[translate]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Translation failed' },
      { status: 500 }
    )
  }
}
