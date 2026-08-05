#!/usr/bin/env node
/**
 * 이미 번역된 키의 값을 다른 키로 복사한다.
 *
 * 같은 문구가 여러 화면에서 쓰이는데 네임스페이스만 다른 경우가 있다. 그때 번역
 * API 를 다시 호출할 이유가 없으므로, 기존 번역을 그대로 옮겨 온다.
 *
 *   node scripts/i18n-copy-key.mjs Challenges.disputeTitle UserProfile.disputeTitle
 *
 * 대상 키에 이미 값이 있으면 건드리지 않는다.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const [fromKey, toKey] = process.argv.slice(2)
if (!fromKey || !toKey) {
  console.error('사용법: node scripts/i18n-copy-key.mjs <원본키> <대상키>')
  process.exit(1)
}

function getPath(obj, key) {
  return key.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj)
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

let copied = 0
let skipped = 0
const missing = []

for (const file of readdirSync('messages').filter(f => f.endsWith('.json')).sort()) {
  const path = join('messages', file)
  const json = JSON.parse(readFileSync(path, 'utf8'))

  const source = getPath(json, fromKey)
  if (typeof source !== 'string' || !source) {
    missing.push(file.replace('.json', ''))
    continue
  }
  const existing = getPath(json, toKey)
  if (typeof existing === 'string' && existing) {
    skipped++
    continue
  }

  setPath(json, toKey, source)
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n')
  copied++
}

console.log(`${fromKey} → ${toKey}`)
console.log(`  복사 ${copied}개, 이미 있어 건너뜀 ${skipped}개`)
if (missing.length) console.log(`  원본 없음: ${missing.join(', ')}`)
