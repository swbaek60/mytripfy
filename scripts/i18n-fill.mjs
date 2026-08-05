/**
 * messages/en.json 에 새로 추가한 키를 나머지 24개 로케일로 번역해 채운다.
 *
 * 화면 문구가 소스에 영어로 하드코딩되어 있으면 25개 언어 중 24개에서 그 자리만
 * 영어로 남는다. 문구를 en.json 으로 옮긴 뒤 이 스크립트로 나머지를 채운다.
 *
 * - Google Cloud Translation v2 를 쓴다 (앱의 UGC 번역과 같은 엔진).
 * - 언어당 한 번의 요청에 여러 문구를 묶어 보낸다 (q 배열).
 * - **이미 값이 있는 키는 건드리지 않는다.** 사람이 다듬은 번역을 덮지 않기 위함.
 * - `{name}` 같은 ICU 자리표시자는 번역되지 않도록 감싸서 보내고 복원한다.
 *
 * 사용법:
 *   node scripts/i18n-fill.mjs                 # en.json 기준으로 빠진 키 전부 채움
 *   node scripts/i18n-fill.mjs --dry           # 무엇이 채워질지만 출력
 *   node scripts/i18n-fill.mjs --ns Sponsors   # 특정 네임스페이스만
 */
import fs from 'node:fs'
import path from 'node:path'

const MESSAGES_DIR = path.join(process.cwd(), 'messages')
const DRY = process.argv.includes('--dry')
const nsArgIdx = process.argv.indexOf('--ns')
const ONLY_NS = nsArgIdx > -1 ? process.argv[nsArgIdx + 1] : null

/** .env.local 에서 키를 읽는다 (next 런타임 밖이라 자동 로드가 안 된다). */
function loadApiKey() {
  if (process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY) {
    return process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY
  }
  for (const file of ['.env.local', '.env']) {
    const full = path.join(process.cwd(), file)
    if (!fs.existsSync(full)) continue
    const m = fs
      .readFileSync(full, 'utf8')
      .match(/^GOOGLE_CLOUD_TRANSLATE_API_KEY=(.+)$/m)
    if (m) return m[1].trim()
  }
  return null
}

function toGoogleTargetLang(locale) {
  if (locale === 'zh') return 'zh-CN'
  if (locale === 'zh-TW') return 'zh-TW'
  if (locale === 'pt-BR') return 'pt'
  return locale
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/**
 * `{count}` 같은 자리표시자를 번역기가 건드리지 않도록 <span translate="no"> 로 감싼다.
 * Google 은 format=html 일 때 이 속성을 존중한다.
 */
function protectPlaceholders(text) {
  return text.replace(/\{[^{}]+\}/g, (m) => `<span translate="no">${m}</span>`)
}

function restorePlaceholders(text) {
  return text.replace(/<span translate="no">\s*(\{[^{}]*\})\s*<\/span>/g, '$1')
}

async function translateBatch(apiKey, texts, targetLang) {
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts.map(protectPlaceholders),
        source: 'en',
        target: toGoogleTargetLang(targetLang),
        format: 'html',
      }),
    }
  )
  if (!res.ok) throw new Error(`Translate API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const out = data?.data?.translations
  if (!Array.isArray(out) || out.length !== texts.length) {
    throw new Error(`Unexpected translation count for ${targetLang}`)
  }
  return out.map((t) => restorePlaceholders(decodeHtmlEntities(t.translatedText)))
}

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, f), 'utf8'))
const writeJson = (f, json) =>
  fs.writeFileSync(path.join(MESSAGES_DIR, f), JSON.stringify(json, null, 2) + '\n', 'utf8')

const en = readJson('en.json')
const locales = fs
  .readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace(/\.json$/, ''))

// 로케일별로 빠진 (namespace, key) 를 모은다.
const plan = new Map() // locale -> [{ ns, key, en }]
for (const locale of locales) {
  const target = readJson(`${locale}.json`)
  const missing = []
  for (const [ns, entries] of Object.entries(en)) {
    if (ONLY_NS && ns !== ONLY_NS) continue
    if (typeof entries !== 'object' || entries === null) continue
    for (const [key, value] of Object.entries(entries)) {
      if (typeof value !== 'string') continue
      if (target[ns] && typeof target[ns][key] === 'string') continue
      missing.push({ ns, key, en: value })
    }
  }
  if (missing.length) plan.set(locale, missing)
}

const totalMissing = [...plan.values()].reduce((n, a) => n + a.length, 0)
if (totalMissing === 0) {
  console.log('빠진 키 없음 — 모든 로케일이 en.json 과 동일합니다.')
  process.exit(0)
}

console.log(`채울 키: ${totalMissing}건 / 로케일 ${plan.size}개`)
for (const [locale, items] of plan) console.log(`  ${locale}: ${items.length}`)

if (DRY) {
  const sample = [...plan.values()][0].slice(0, 20)
  console.log('\n예시 (en 원문):')
  for (const s of sample) console.log(`  ${s.ns}.${s.key} = ${JSON.stringify(s.en)}`)
  process.exit(0)
}

const apiKey = loadApiKey()
if (!apiKey) {
  console.error('GOOGLE_CLOUD_TRANSLATE_API_KEY 가 없습니다 (.env.local 확인).')
  process.exit(1)
}

const BATCH = 64
let done = 0

for (const [locale, items] of plan) {
  const target = readJson(`${locale}.json`)

  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH)
    let translated
    try {
      translated = await translateBatch(apiKey, slice.map((s) => s.en), locale)
    } catch (err) {
      console.error(`  ${locale} 실패: ${err.message}`)
      break
    }
    slice.forEach((s, idx) => {
      target[s.ns] ??= {}
      target[s.ns][s.key] = translated[idx]
    })
    done += slice.length
  }

  // 네임스페이스 키 순서를 en.json 과 맞춰 diff 를 읽기 쉽게 유지한다.
  const ordered = {}
  for (const ns of Object.keys(en)) {
    if (target[ns] === undefined) continue
    if (typeof target[ns] !== 'object' || target[ns] === null) {
      ordered[ns] = target[ns]
      continue
    }
    const nsOut = {}
    for (const key of Object.keys(en[ns])) {
      if (target[ns][key] !== undefined) nsOut[key] = target[ns][key]
    }
    for (const key of Object.keys(target[ns])) {
      if (nsOut[key] === undefined) nsOut[key] = target[ns][key]
    }
    ordered[ns] = nsOut
  }
  for (const ns of Object.keys(target)) if (ordered[ns] === undefined) ordered[ns] = target[ns]

  writeJson(`${locale}.json`, ordered)
  console.log(`  ${locale} 완료 (${items.length})`)
}

console.log(`\n총 ${done}건 채웠습니다.`)
