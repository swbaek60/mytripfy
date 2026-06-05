#!/usr/bin/env node
/**
 * 일일 파이프라인: 생성 → (선택) Supabase 업로드 → Instagram 게시
 *   node scripts/sns-run-daily.mjs
 *   node scripts/sns-run-daily.mjs --date=2026-05-21 --publish
 */
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { getEnv } from './lib/sns-env.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function run(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, script), ...args], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(script + ' exit ' + code))))
  })
}

function parseArgs() {
  const args = process.argv.slice(2)
  let date = ''
  let publish = false
  let noImages = false
  for (const a of args) {
    if (a.startsWith('--date=')) date = a
    if (a === '--publish') publish = true
    if (a === '--no-images') noImages = true
  }
  const start = getEnv('SNS_CAMPAIGN_START', '')
  const genArgs = []
  if (date) genArgs.push(date)
  if (start) genArgs.push('--start=' + start)
  if (noImages) genArgs.push('--no-images')
  return { genArgs, publish, dateArg: date ? date.replace('--date=', '') : new Date().toISOString().slice(0, 10) }
}

async function main() {
  const { genArgs, publish, dateArg } = parseArgs()
  console.log('=== 1/2 콘텐츠 생성 ===')
  await run('generate-sns-daily.mjs', genArgs)

  if (publish) {
    console.log('\n=== 2/2 Instagram 게시 ===')
    await run('publish-sns-daily.mjs', ['--date=' + dateArg])
  } else {
    console.log('\n게시 생략 ( --publish 또는 SNS_PUBLISH_DRY_RUN=false + publish-sns-daily )')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
