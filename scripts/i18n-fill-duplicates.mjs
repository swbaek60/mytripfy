#!/usr/bin/env node
/**
 * 이미 번역된 동일 문구를 재사용해 누락 키를 채운다.
 *
 * en.json 에는 같은 영어 문구가 네임스페이스만 달라 여러 키로 존재하는 경우가 많다
 * ("Save", "Cancel", "Dispute" 등). 어떤 로케일에서 그 문구 중 하나는 번역돼 있고
 * 다른 하나는 비어 있다면, 번역 API 를 부를 필요 없이 기존 번역을 옮기면 된다.
 *
 * 안전 규칙
 *  - 영어 원문이 완전히 일치할 때만 복사한다 (대소문자·공백 포함).
 *  - ICU 플레이스홀더 집합이 다르면 건너뛴다.
 *  - 같은 문구에 서로 다른 번역이 존재하면(문맥에 따라 다르게 번역된 경우)
 *    어느 쪽이 맞는지 알 수 없으므로 건너뛴다.
 *
 * `--dry` 를 주면 파일을 쓰지 않고 개수만 보고한다.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MESSAGES_DIR = 'messages'
const BASE_LOCALE = 'en'
const dryRun = process.argv.includes('--dry')

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out.set(key, v)
  }
  return out
}

function setPath(obj, key, value) {
  const parts = key.split('.')
  const last = parts.pop()
  let node = obj
  for (const part of parts) {
    if (typeof node[part] !== 'object' || node[part] === null) node[part] = {}
    node = node[part]
  }
  node[last] = value
}

/** `{count}` 같은 ICU 플레이스홀더 집합. 다르면 문구를 재사용할 수 없다. */
function placeholders(text) {
  return [...String(text).matchAll(/\{(\w+)/g)].map(m => m[1]).sort().join(',')
}

const base = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, `${BASE_LOCALE}.json`), 'utf8')))

// 영어 원문 → 그 원문을 쓰는 키 목록
const keysByEnglish = new Map()
for (const [key, value] of base) {
  if (typeof value !== 'string' || !value.trim()) continue
  const list = keysByEnglish.get(value)
  if (list) list.push(key)
  else keysByEnglish.set(value, [key])
}
const duplicated = new Map([...keysByEnglish].filter(([, keys]) => keys.length > 1))

console.log(
  `en 키 ${base.size}개 중 중복 문구 ${duplicated.size}종 (키 ${[...duplicated.values()].reduce((s, k) => s + k.length, 0)}개)\n`
)

const locales = readdirSync(MESSAGES_DIR)
  .filter(f => f.endsWith('.json') && f !== `${BASE_LOCALE}.json`)
  .map(f => f.replace('.json', ''))
  .sort()

let grandTotal = 0
let conflicts = 0

for (const locale of locales) {
  const path = join(MESSAGES_DIR, `${locale}.json`)
  const json = JSON.parse(readFileSync(path, 'utf8'))
  const flat = flatten(json)
  let filled = 0

  for (const [english, keys] of duplicated) {
    const missing = keys.filter(k => {
      const v = flat.get(k)
      return v === undefined || v === ''
    })
    if (!missing.length) continue

    // 이 문구에 대해 이미 존재하는 번역들. 영어 원문과 같은 값(미번역 복사본)은 제외.
    const translations = new Set(
      keys
        .map(k => flat.get(k))
        .filter(v => typeof v === 'string' && v !== '' && v !== english)
    )
    if (translations.size === 0) continue
    if (translations.size > 1) {
      conflicts++
      continue // 같은 문구가 문맥별로 다르게 번역돼 있다. 사람이 판단해야 한다.
    }

    const [translation] = translations
    if (placeholders(translation) !== placeholders(english)) continue

    for (const key of missing) {
      setPath(json, key, translation)
      filled++
    }
  }

  if (filled && !dryRun) writeFileSync(path, JSON.stringify(json, null, 2) + '\n')
  if (filled) console.log(`${locale.padEnd(7)} ${String(filled).padStart(4)}개 채움`)
  grandTotal += filled
}

console.log(`\n합계 ${grandTotal}개 ${dryRun ? '(dry run — 파일 미변경)' : '채움'}`)
if (conflicts) console.log(`문맥별로 다르게 번역돼 건너뛴 경우 ${conflicts}건`)
