#!/usr/bin/env node
/**
 * Merge messages/*.json with en.json: for each locale file, add any key that exists in en but is missing.
 * Values for new keys are taken from en (so UI works); existing locale keys are preserved.
 * Run from project root: node scripts/merge-messages-with-en.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const messagesDir = path.join(__dirname, '..', 'messages')
const enPath = path.join(messagesDir, 'en.json')

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))

function deepMergeKeys(target, source) {
  if (typeof source !== 'object' || source === null) return
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      target[key] = typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])
        ? JSON.parse(JSON.stringify(source[key]))
        : source[key]
    } else if (
      typeof target[key] === 'object' &&
      target[key] !== null &&
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      !Array.isArray(target[key])
    ) {
      deepMergeKeys(target[key], source[key])
    }
  }
}

const locales = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json') && f !== 'en.json')
for (const file of locales) {
  const filePath = path.join(messagesDir, file)
  const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  deepMergeKeys(locale, en)
  fs.writeFileSync(filePath, JSON.stringify(locale, null, 2) + '\n', 'utf8')
  console.log('Merged en →', file)
}
console.log('Done. All locale files now have the same keys as en.json.')
