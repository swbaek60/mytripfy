#!/usr/bin/env node
import './lib/load-sns-env.mjs'
/**
 * 특정 날짜·캐릭터 캐러셀 이미지만 생성
 *   node --env-file=.env.local scripts/generate-character-images.mjs --date=2026-05-22 --character=ethan
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { formatDayBundle, dayIndexFromStart } from './lib/sns-campaign-config.mjs'
import {
  generateImageBuffer,
  getImageDelayMs,
  getImageProviderLabel,
  sleep,
} from './lib/sns-image-provider.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')

function parseArgs(argv) {
  let dateStr = ''
  let character = 'ethan'
  let slide = 0
  for (const a of argv) {
    if (a.startsWith('--date=')) dateStr = a.slice(7)
    if (a.startsWith('--character=')) character = a.slice(12)
    if (a.startsWith('--slide=')) slide = Number(a.slice(8))
  }
  if (!dateStr) throw new Error('--date=YYYY-MM-DD required')
  if (!['sua', 'ethan'].includes(character)) throw new Error('--character=sua|ethan')
  if (slide && (slide < 1 || slide > 4)) throw new Error('--slide=1..4')
  return { dateStr, character, slide }
}

function stripPromptNumber(p) {
  return p.replace(/^\d+\.\s*/, '').trim()
}

async function main() {
  const { dateStr, character, slide } = parseArgs(process.argv.slice(2))
  const start = process.env.SNS_CAMPAIGN_START || '2026-05-22'
  const date = new Date(dateStr + 'T12:00:00')
  const day1Based = dayIndexFromStart(date, start)
  const bundle = await formatDayBundle(day1Based, date)
  const dateDir = path.join(OUT_DIR, dateStr)
  if (!fs.existsSync(dateDir)) fs.mkdirSync(dateDir, { recursive: true })

  const prompts = character === 'sua' ? bundle.suaPrompts : bundle.ethanPrompts
  console.log(`이미지 · ${dateStr} · ${character} · ${getImageProviderLabel()}`)
  const delay = getImageDelayMs()
  const indices = slide ? [slide - 1] : [0, 1, 2, 3]
  for (let j = 0; j < indices.length; j++) {
    const i = indices[j]
    process.stdout.write(`  ${character} ${i + 1}/4 ... `)
    try {
      const buf = await generateImageBuffer(stripPromptNumber(prompts[i]), { character })
      fs.writeFileSync(path.join(dateDir, `${character}-${i + 1}.png`), buf)
      console.log('OK')
    } catch (e) {
      console.log('실패:', e.message)
    }
    if (j < indices.length - 1) await sleep(delay)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
