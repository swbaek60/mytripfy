#!/usr/bin/env node
/**
 * SNS 일일 자동 실행 (버튼/수동 없이 스케줄러에서 호출)
 *
 *   node scripts/sns-auto-daily.mjs
 *   node scripts/sns-auto-daily.mjs --publish
 *
 * 환경: .env.local (OPENAI_API_KEY) + .env.sns 자동 로드
 * 로그: scripts/out/sns-auto.log
 */
import './lib/load-sns-env.mjs'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { getEnv } from './lib/sns-env.mjs'
import { resolveImageProvider } from './lib/sns-image-provider.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LOG_FILE = path.join(__dirname, 'out', 'sns-auto.log')

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  if (!fs.existsSync(path.dirname(LOG_FILE))) {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
  }
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8')
}

function runNode(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script), ...args], {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} exited ${code}`))
    })
  })
}

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseArgs() {
  let publish = false
  let noImages = false
  for (const a of process.argv.slice(2)) {
    if (a === '--publish') publish = true
    if (a === '--no-images') noImages = true
  }
  if (getEnv('SNS_AUTO_PUBLISH', 'false') === 'true') publish = true
  if (getEnv('SNS_SKIP_IMAGES', 'false') === 'true') noImages = true
  if (getEnv('SNS_USE_MANUAL_IMAGES', 'false') === 'true') noImages = true
  return { publish, noImages }
}

async function main() {
  let { publish, noImages } = parseArgs()
  const date = todayStr()
  const start = getEnv('SNS_CAMPAIGN_START', date)

  log(`=== SNS auto daily start (date=${date}, start=${start}, publish=${publish}, images=${!noImages}) ===`)

  const provider = resolveImageProvider()
  if (!noImages) {
    log('이미지 엔진: ' + provider + (provider === 'pollinations' ? ' (무료, 키 불필요)' : ''))
  }

  const genArgs = [`--date=${date}`, `--start=${start}`]
  if (noImages) genArgs.push('--no-images')

  await runNode('generate-sns-daily.mjs', genArgs)
  log('generate-sns-daily OK')

  const dateDir = path.join(__dirname, 'out', date)
  const hasPng =
    fs.existsSync(dateDir) &&
    fs.readdirSync(dateDir).some((f) => f.endsWith('.png'))

  if (publish && hasPng) {
    try {
      await runNode('ensure-sns-storage-bucket.mjs')
      await runNode('upload-sns-images.mjs', [`--date=${date}`])
      log('upload-sns-images OK')
    } catch (e) {
      log('upload-sns-images WARN: ' + e.message)
    }
  }

  if (publish) {
    const baseUrl = getEnv('SNS_IMAGE_BASE_URL', '')
    if (!getEnv('META_ACCESS_TOKEN') || !getEnv('INSTAGRAM_SUA_USER_ID')) {
      log('publish SKIP: Meta/Instagram secrets 없음 — secrets/*.txt 참고')
    } else if (!baseUrl) {
      log('publish SKIP: SNS_IMAGE_BASE_URL 없음')
    } else {
      process.env.SNS_PUBLISH_DRY_RUN = 'false'
      const pubArgs = [`--date=${date}`, `--base-url=${baseUrl}`]
      await runNode('publish-sns-daily.mjs', pubArgs)
      log('publish-sns-daily OK')
    }
  } else {
    log('publish skipped (SNS_AUTO_PUBLISH=false)')
  }

  log('=== SNS auto daily done ===')
}

main().catch((e) => {
  log('ERROR: ' + (e.message || e))
  process.exit(1)
})
