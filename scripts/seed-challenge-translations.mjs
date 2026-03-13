/**
 * 챌린지 번역 시드 (ko, ja, zh, es, fr, de, pt, it).
 * Google Cloud Translation API v2 사용.
 *
 * 동작: challenge_translations 에 이미 해당 언어로 설명(description)이 있는 챌린지는
 *       건너뛰고, 번역이 없거나 비어 있는 것만 API 호출 후 저장 → 무료 한도 절약.
 *
 * 필요 env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLOUD_TRANSLATE_API_KEY
 *
 * 실행: node --env-file=.env.local scripts/seed-challenge-translations.mjs
 */

import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 50
// ko, zh, ja 우선 권장. zh-TW(번체), es, fr 등 추가 가능
const ALL_TARGET_LANGS = ['ko', 'ja', 'zh', 'zh-TW', 'es', 'fr', 'de', 'pt', 'it']

async function translateBatch(apiKey, texts, targetLang, sourceLang = 'en') {
  if (texts.length === 0) return []
  // Google API: zh → zh-CN, zh-TW → zh-TW, 나머지 그대로
  const apiTarget = targetLang === 'zh' ? 'zh-CN' : targetLang
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        target: apiTarget,
        source: sourceLang,
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Translate API ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.data.translations.map((t) => t.translatedText)
}

/** API가 반환하는 HTML 엔티티 복원 (저장 전 적용) */
function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return text || ''
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** 설명 문단에서 번역된 제목을 원문(고유명사)으로 되돌림. 예: "연금술사" → "Alchemist" */
function restoreProperNounInDescription(description, translatedTitle, originalTitleEn) {
  if (!description || !originalTitleEn || translatedTitle === originalTitleEn) return description
  if (!description.includes(translatedTitle)) return description
  return description.split(translatedTitle).join(originalTitleEn)
}

function parseEnvInt(name, defaultVal) {
  const v = process.env[name]
  if (v === undefined || v === '') return defaultVal
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? defaultVal : n
}

function parseEnvLangs() {
  const v = process.env.LANGUAGES
  if (!v || !v.trim()) return ALL_TARGET_LANGS
  return v.split(',').map((s) => s.trim()).filter(Boolean)
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요')
    process.exit(1)
  }
  if (!apiKey) {
    console.error('GOOGLE_CLOUD_TRANSLATE_API_KEY 필요')
    process.exit(1)
  }

  const targetLangs = parseEnvLangs()
  const maxChars = parseEnvInt('MAX_CHARS', 0)
  const challengeOffset = parseEnvInt('CHALLENGE_OFFSET', 0)

  const supabase = createClient(supabaseUrl, serviceKey)

  // Supabase/PostgREST는 요청당 최대 1000행이므로, 1000건씩 나눠서 전부 가져옴
  const PAGE_SIZE = 1000
  const allChallenges = []
  let page = 0
  while (true) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data: pageData, error: fetchErr } = await supabase
      .from('challenges')
      .select('id, title_en, description_en')
      .not('title_en', 'is', null)
      .order('id', { ascending: true })
      .range(from, to)
    if (fetchErr) {
      console.error('challenges 조회 실패:', fetchErr)
      process.exit(1)
    }
    if (!pageData?.length) break
    allChallenges.push(...pageData)
    if (pageData.length < PAGE_SIZE) break
    page += 1
  }

  if (!allChallenges.length) {
    console.log('챌린지 없음.')
    return
  }
  console.log(`챌린지 전체 ${allChallenges.length}건 로드됨`)

  let challenges = allChallenges
  if (challengeOffset > 0) {
    challenges = allChallenges.slice(challengeOffset)
    console.log(`CHALLENGE_OFFSET=${challengeOffset} → 이번 달 처리 시작 인덱스: ${challengeOffset}`)
  }

  if (maxChars > 0) {
    const langCount = targetLangs.length
    let acc = 0
    let take = 0
    for (let i = 0; i < challenges.length; i++) {
      const c = challenges[i]
      const len = (c.title_en?.length || 0) + (c.description_en?.length || 0)
      if (acc + len * langCount > maxChars) break
      acc += len * langCount
      take = i + 1
    }
    challenges = challenges.slice(0, take)
    console.log(`MAX_CHARS=${maxChars} → 이번 달 처리 챌린지 수: ${challenges.length} (예상 사용 글자 수: ${acc})`)
  }

  if (challenges.length === 0) {
    console.log('이번 달에 처리할 챌린지 없음. (CHALLENGE_OFFSET을 올리거나 MAX_CHARS를 키우세요)')
    return
  }

  const challengeIds = challenges.map((c) => c.id)

  // 이미 번역이 있는 (challenge_id, lang): description 이 비어 있지 않은 것만 (행 제한 넉넉히)
  const { data: existingRows } = await supabase
    .from('challenge_translations')
    .select('challenge_id, lang, description')
    .in('challenge_id', challengeIds)
    .in('lang', targetLangs)
    .limit(10000)

  const hasTranslation = new Set()
  for (const r of existingRows || []) {
    const desc = r.description
    if (desc != null && String(desc).trim().length > 0) {
      hasTranslation.add(`${r.challenge_id}:${r.lang}`)
    }
  }

  console.log(`\n챌린지 ${challenges.length}개, 언어 ${targetLangs.length}개 (${targetLangs.join(', ')}) — 번역 없는 것만 처리\n`)

  for (const lang of targetLangs) {
    const needTranslation = challenges.filter((c) => !hasTranslation.has(`${c.id}:${lang}`))
    if (needTranslation.length === 0) {
      console.log(`[${lang}] 이미 모두 번역됨, 스킵`)
      continue
    }
    console.log(`[${lang}] 번역 필요: ${needTranslation.length}건 (전체 ${challenges.length}건 중)`)

    const toInsert = []

    for (let i = 0; i < needTranslation.length; i += BATCH_SIZE) {
      const batch = needTranslation.slice(i, i + BATCH_SIZE)
      const titles = batch.map((c) => c.title_en || '')
      const descs = batch.map((c) => c.description_en || '')

      const [translatedTitles, translatedDescs] = await Promise.all([
        translateBatch(apiKey, titles, lang),
        translateBatch(apiKey, descs, lang),
      ])

      for (let j = 0; j < batch.length; j++) {
        const origTitle = batch[j].title_en || ''
        const trTitle = (translatedTitles[j] ?? origTitle).trim()
        let trDesc = translatedDescs[j] || null
        if (trDesc) {
          trDesc = decodeHtmlEntities(trDesc)
          trDesc = restoreProperNounInDescription(trDesc, trTitle, origTitle)
        }
        const title = decodeHtmlEntities(trTitle)
        toInsert.push({
          challenge_id: batch[j].id,
          lang,
          title: title || origTitle,
          description: trDesc,
        })
      }
      process.stdout.write(`  ${Math.min(i + BATCH_SIZE, needTranslation.length)}/${needTranslation.length}\r`)
    }

    const { error: insertErr } = await supabase
      .from('challenge_translations')
      .upsert(toInsert, { onConflict: 'challenge_id,lang' })

    if (insertErr) {
      console.error(`  ${lang} INSERT 실패:`, insertErr)
    } else {
      console.log(`  ${lang} 완료: ${toInsert.length}건`)
    }
  }

  const nextOffset = challengeOffset + challenges.length
  console.log('\n시드 완료.')
  if (maxChars > 0 && nextOffset < allChallenges.length) {
    console.log(`\n다음 달에 아래처럼 실행하세요 (무료 한도 유지):`)
    console.log(`  LANGUAGES=${targetLangs.join(',')} MAX_CHARS=${maxChars} CHALLENGE_OFFSET=${nextOffset}`)
    console.log(`  또는 .env.local 에 추가 후 npm run seed:translations`)
    console.log(`    CHALLENGE_OFFSET=${nextOffset}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
