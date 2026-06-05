#!/usr/bin/env node
import './lib/load-sns-env.mjs'
/**
 * 수아·이든 레퍼런스 이미지 생성 — OpenAI API (Cursor Generate 버튼 불필요)
 * OPENAI_API_KEY → .env.local
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ACCOUNTS, wrapTravelPhotoPrompt } from './lib/sns-campaign-config.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'sns')
import {
  generateImageBuffer,
  getImageProviderLabel,
  IMAGE_DELAY_MS,
  sleep,
} from './lib/sns-image-provider.mjs'

const DELAY_MS = IMAGE_DELAY_MS

const JOBS = [
  {
    file: 'sua-ref-front.png',
    prompt: wrapTravelPhotoPrompt(
      ACCOUNTS.sua.faceBlock + ', natural profile headshot outdoors Seoul, soft bokeh, real phone selfie aesthetic'
    ),
  },
  {
    file: 'sua-ref-full.png',
    prompt: wrapTravelPhotoPrompt(
      ACCOUNTS.sua.faceBlock + ', full body on real Seoul street, cream blazer outfit, candid travel blogger pose'
    ),
  },
  {
    file: 'ethan-ref-front.png',
    prompt: wrapTravelPhotoPrompt(
      ACCOUNTS.ethan.faceBlock + ', natural profile headshot, urban background, real phone photo look'
    ),
  },
  {
    file: 'ethan-ref-full.png',
    prompt: wrapTravelPhotoPrompt(
      ACCOUNTS.ethan.faceBlock + ', full body on real city sidewalk, charcoal sweater jeans, candid stance'
    ),
  },
]

async function main() {
  console.log('이미지 엔진:', getImageProviderLabel(), getImageProviderLabel() === 'pollinations' ? '(무료)' : '')
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true })

  for (const job of JOBS) {
    const outPath = path.join(ASSETS_DIR, job.file)
    process.stdout.write('생성 중: ' + job.file + ' ... ')
    try {
      const buf = await generateImageBuffer(job.prompt)
      fs.writeFileSync(outPath, buf)
      console.log('OK → ' + outPath)
    } catch (e) {
      console.log('실패:', e.message)
    }
    await sleep(DELAY_MS)
  }
  console.log('\n완료. 프로필 사진은 *-ref-front.png 를 사용하세요.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
