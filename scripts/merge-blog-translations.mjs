#!/usr/bin/env node
/**
 * ja, zh, es, fr, de 메시지 파일에 Blog + nav 키 병합
 * node scripts/merge-blog-translations.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { BLOG_LOCALE_OVERRIDES } from './lib/blog-translations-data.mjs'
import { BLOG_LOCALE_OVERRIDES_PART2 } from './lib/blog-translations-data-part2.mjs'

const ALL_OVERRIDES = { ...BLOG_LOCALE_OVERRIDES, ...BLOG_LOCALE_OVERRIDES_PART2 }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const messagesDir = path.join(__dirname, '..', 'messages')

function deepMerge(target, source) {
  const out = { ...target }
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] !== null) {
      out[k] = deepMerge(out[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}

for (const [locale, overrides] of Object.entries(ALL_OVERRIDES)) {
  const filePath = path.join(messagesDir, `${locale}.json`)
  if (!fs.existsSync(filePath)) {
    console.warn(`skip ${locale}: file missing`)
    continue
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const merged = deepMerge(data, overrides)
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  console.log(`merged Blog → messages/${locale}.json`)
}

console.log('done')
