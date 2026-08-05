#!/usr/bin/env node
/**
 * 로케일 파일의 번역 누락을 점검한다.
 *
 * en.json 을 기준으로 각 로케일에서
 *   - missing:    키가 아예 없거나 빈 문자열
 *   - untouched:  값이 영어 원문과 글자 그대로 같다 (복사만 해 둔 상태)
 *   - extra:      en 에 없는 키 (오타 또는 지워진 키의 잔재)
 * 를 센다.
 *
 * `--strict` 를 주면 누락이 하나라도 있을 때 종료 코드 1 을 반환한다. CI 에서
 * 영어만 있는 키가 새로 들어오는 것을 막는 용도다.
 *
 * 고유명사·기술 용어처럼 원문과 같아야 정상인 값도 있으므로 untouched 는 참고용이다.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MESSAGES_DIR = 'messages'
const BASE_LOCALE = 'en'
const strict = process.argv.includes('--strict')

/** 원문과 같아도 이상하지 않은 값 (브랜드명·기호·숫자 등). */
function looksLocaleAgnostic(value) {
  if (typeof value !== 'string') return true
  const t = value.trim()
  if (!t) return true
  if (t.length <= 2) return true
  if (!/[a-zA-Z]/.test(t)) return true // 기호·숫자·이모지만
  return /^(mytripfy|MyTripfy|OK|URL|ID|PT|SNS|FAQ|AI)$/.test(t)
}

function flatten(obj, prefix = '') {
  const out = new Map()
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [ck, cv] of flatten(v, key)) out.set(ck, cv)
    } else {
      out.set(key, v)
    }
  }
  return out
}

const base = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, `${BASE_LOCALE}.json`), 'utf8')))

const locales = readdirSync(MESSAGES_DIR)
  .filter(f => f.endsWith('.json') && f !== `${BASE_LOCALE}.json`)
  .map(f => f.replace('.json', ''))
  .sort()

const report = []
for (const locale of locales) {
  const target = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8')))
  const missing = []
  const untouched = []

  for (const [key, enValue] of base) {
    const value = target.get(key)
    if (value === undefined || value === '') missing.push(key)
    else if (value === enValue && !looksLocaleAgnostic(enValue)) untouched.push(key)
  }
  const extra = [...target.keys()].filter(k => !base.has(k))

  report.push({ locale, missing, untouched, extra })
}

const pad = (s, n) => String(s).padEnd(n)
const num = (s, n) => String(s).padStart(n)

console.log(`기준 로케일 ${BASE_LOCALE}: 키 ${base.size}개, 대상 로케일 ${locales.length}개\n`)
console.log(`${pad('locale', 8)}${num('missing', 8)}${num('untouched', 11)}${num('extra', 7)}`)
console.log('-'.repeat(34))
for (const r of [...report].sort((a, b) => b.missing.length - a.missing.length)) {
  console.log(
    pad(r.locale, 8) + num(r.missing.length, 8) + num(r.untouched.length, 11) + num(r.extra.length, 7)
  )
}

const totalMissing = report.reduce((s, r) => s + r.missing.length, 0)
const totalUntouched = report.reduce((s, r) => s + r.untouched.length, 0)
const totalExtra = report.reduce((s, r) => s + r.extra.length, 0)
console.log('-'.repeat(34))
console.log(pad('합계', 7) + num(totalMissing, 8) + num(totalUntouched, 11) + num(totalExtra, 7))

// 어느 키가 가장 많은 로케일에서 빠졌는지 = 최근에 영어로만 추가된 키.
const missingByKey = new Map()
for (const r of report) {
  for (const key of r.missing) missingByKey.set(key, (missingByKey.get(key) ?? 0) + 1)
}
const worst = [...missingByKey.entries()]
  .filter(([, count]) => count === locales.length)
  .map(([key]) => key)
if (worst.length) {
  console.log(`\n모든 로케일에서 빠진 키 ${worst.length}개 (영어로만 추가된 문구):`)
  for (const key of worst.slice(0, 20)) console.log(`  ${key}`)
  if (worst.length > 20) console.log(`  ... 외 ${worst.length - 20}개`)
}

console.log(
  '\n채우기: GOOGLE_CLOUD_TRANSLATE_API_KEY 설정 후 `node scripts/i18n-fill.mjs` 를 실행한다.'
)

if (strict && totalMissing > 0) {
  console.error(`\n번역 누락 ${totalMissing}건 (strict 모드)`)
  process.exit(1)
}
