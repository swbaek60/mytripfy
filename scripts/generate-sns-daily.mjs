#!/usr/bin/env node
import './lib/load-sns-env.mjs'
/**
 * SNS 캠페인 일일 콘텐츠 생성
 *   node scripts/generate-sns-daily.mjs
 *   node scripts/generate-sns-daily.mjs --days=7
 *   node scripts/generate-sns-daily.mjs --date=2026-05-21 --start=2026-05-21
 *   node scripts/generate-sns-daily.mjs --no-images
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  TOTAL_COUNTRIES,
  formatDayBundle,
  parseContentArgs,
  dayIndexFromStart,
} from './lib/sns-campaign-config.mjs'

import {
  generateImageBuffer,
  getImageProviderLabel,
  getImageDelayMs,
  sleep,
} from './lib/sns-image-provider.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')

function stripPromptNumber(p) {
  return p.replace(/^\d+\.\s*/, '').trim()
}

async function generateAndSaveImages(dateDir, suaPrompts, ethanPrompts) {
  const provider = getImageProviderLabel()
  console.log('  이미지 엔진: ' + provider + (provider === 'pollinations' ? ' (무료)' : ''))
  const delay = getImageDelayMs()
  for (let i = 0; i < 4; i++) {
    process.stdout.write('  수아 ' + (i + 1) + '/4 ... ')
    try {
      const buf = await generateImageBuffer(stripPromptNumber(suaPrompts[i]), { character: 'sua' })
      fs.writeFileSync(path.join(dateDir, `sua-${i + 1}.png`), buf)
      console.log('OK')
    } catch (e) {
      console.log('실패:', e.message)
    }
    await sleep(delay)
  }
  for (let i = 0; i < 4; i++) {
    process.stdout.write('  이든 ' + (i + 1) + '/4 ... ')
    try {
      const buf = await generateImageBuffer(stripPromptNumber(ethanPrompts[i]), { character: 'ethan' })
      fs.writeFileSync(path.join(dateDir, `ethan-${i + 1}.png`), buf)
      console.log('OK')
    } catch (e) {
      console.log('실패:', e.message)
    }
    await sleep(delay)
  }
}

function writeMetaJson(dateDir, bundle) {
  fs.writeFileSync(
    path.join(dateDir, 'meta.json'),
    JSON.stringify(
      {
        date: bundle.dateStr,
        day: bundle.day1Based,
        rotationPolicy: {
          adjacentDayDifferentOutfit: true,
          sameDaySlidesShareOutfit: 4,
          outfitReuseAfterDays: 10,
          yearlyOutfitPoolSize: 50,
        },
        sua: {
          caption: bundle.suaCaption,
          country: bundle.suaCountry,
          reels: bundle.meta.sua.reels,
          outfit: {
            index: bundle.suaOutfit.outfitIndex ?? null,
            summaryKo: bundle.suaOutfit.summaryKo,
            summaryEn: bundle.suaOutfit.summaryEn,
            promptLock: bundle.suaOutfit.promptLock,
          },
          weather: bundle.suaWeather,
        },
        ethan: {
          caption: bundle.ethanCaption,
          country: bundle.ethanCountry,
          reels: bundle.meta.ethan.reels,
          outfit: {
            index: bundle.ethanOutfit.outfitIndex ?? null,
            summaryKo: bundle.ethanOutfit.summaryKo,
            summaryEn: bundle.ethanOutfit.summaryEn,
            promptLock: bundle.ethanOutfit.promptLock,
          },
          weather: bundle.ethanWeather,
        },
      },
      null,
      2
    ),
    'utf8'
  )
}

async function main() {
  const { date, start, days, skipImages } = parseContentArgs(process.argv.slice(2))
  const startDay = Math.max(1, dayIndexFromStart(date, start))
  const dayResults = []

  for (let i = 0; i < days; i++) {
    const day1Based = startDay + i
    const d = new Date(date)
    d.setDate(d.getDate() + i)
    const bundle = await formatDayBundle(day1Based, d)

    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`  SNS · ${bundle.dateStr} · Day ${bundle.day1Based}`)
    console.log(
      `  수아: ${bundle.suaCountry.name} (${bundle.suaCountry.code}) ${bundle.suaCountry.visitNumber}/${TOTAL_COUNTRIES}`
    )
    console.log(
      `  이든: ${bundle.ethanCountry.name} (${bundle.ethanCountry.code}) ${bundle.ethanCountry.visitNumber}/${TOTAL_COUNTRIES}`
    )
    console.log('═══════════════════════════════════════════════════════════')

    const dateDir = path.join(OUT_DIR, bundle.dateStr)
    if (!fs.existsSync(dateDir)) fs.mkdirSync(dateDir, { recursive: true })
    fs.writeFileSync(path.join(dateDir, 'sua.txt'), bundle.suaTxt, 'utf8')
    fs.writeFileSync(path.join(dateDir, 'ethan.txt'), bundle.ethanTxt, 'utf8')
    writeMetaJson(dateDir, bundle)
    dayResults.push({ dateDir, bundle })
  }

  console.log('\n저장:', dayResults.map((r) => r.dateDir).join('\n  '))

  if (!skipImages && dayResults.length > 0) {
    console.log('\n이미지 생성 (' + getImageProviderLabel() + '):')
    for (const { dateDir, bundle } of dayResults) {
      console.log('  ' + bundle.dateStr)
      await generateAndSaveImages(dateDir, bundle.suaPrompts, bundle.ethanPrompts)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
