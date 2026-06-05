#!/usr/bin/env node
import './lib/load-sns-env.mjs'
/**
 * scripts/out/YYYY-MM-DD/ 의 이미지·캡션을 Instagram에 캐러셀 게시
 *
 * Meta API는 공개 image_url 필요 → Supabase Storage 또는 CDN URL을 --base-url 로 전달
 *
 *   node scripts/publish-sns-daily.mjs --date=2026-05-21
 *   node scripts/publish-sns-daily.mjs --date=2026-05-21 --character=sua
 *   node scripts/publish-sns-daily.mjs --date=2026-05-21 --base-url=https://xxx.supabase.co/storage/v1/object/public/sns/
 *
 * SNS_PUBLISH_DRY_RUN=true 이면 API 호출 없음
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getEnv, requireEnv, getInstagramAccounts } from './lib/sns-env.mjs'
import { publishCarousel } from './lib/meta-instagram.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')

function parseArgs() {
  const args = process.argv.slice(2)
  let date = new Date().toISOString().slice(0, 10)
  let character = 'both'
  let baseUrl = getEnv('SNS_IMAGE_BASE_URL', '')
  for (const a of args) {
    if (a.startsWith('--date=')) date = a.slice(7)
    if (a.startsWith('--character=')) character = a.slice(12)
    if (a.startsWith('--base-url=')) baseUrl = a.slice(11)
  }
  return { date, character, baseUrl }
}

function readCaption(dateDir, char) {
  const metaPath = path.join(dateDir, 'meta.json')
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    return meta[char]?.caption || ''
  }
  const txt = fs.readFileSync(path.join(dateDir, char + '.txt'), 'utf8')
  const marker = char === 'sua' ? '[캡션 · 한 포스트에 그대로 사용]' : '[Caption · use as single post]'
  const idx = txt.indexOf(marker)
  if (idx === -1) return txt
  const rest = txt.slice(idx + marker.length).trim()
  const end = rest.indexOf('\n\n[')
  return (end === -1 ? rest : rest.slice(0, end)).trim()
}

function imageUrlsFor(dateDir, char, baseUrl) {
  const urls = []
  for (let i = 1; i <= 4; i++) {
    const local = path.join(dateDir, `${char}-${i}.png`)
    if (!fs.existsSync(local)) throw new Error('Missing: ' + local)
    if (!baseUrl) {
      throw new Error(
        '공개 URL 필요: --base-url= 또는 SNS_IMAGE_BASE_URL (Supabase public bucket 등). Meta API는 로컬 파일 직접 업로드 불가.'
      )
    }
    const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
    const folder = path.basename(dateDir)
    urls.push(`${base}${folder}/${char}-${i}.png`)
  }
  return urls
}

async function publishOne(character, dateDir, baseUrl, dryRun) {
  const accounts = getInstagramAccounts()
  const acc = accounts[character]
  if (!acc.igUserId) throw new Error(`INSTAGRAM_${character.toUpperCase()}_USER_ID missing`)
  const token = acc.accessToken || requireEnv('META_ACCESS_TOKEN')
  const caption = readCaption(dateDir, character)
  const urls = imageUrlsFor(dateDir, character, baseUrl)

  console.log(`[${character}] 캐러셀 4장, 캡션 ${caption.length}자`)
  if (dryRun) {
    console.log('  DRY RUN — URLs:', urls)
    return
  }
  const result = await publishCarousel(acc.igUserId, urls, caption, token)
  console.log('  게시 완료:', result.id || JSON.stringify(result))
}

async function main() {
  const { date, character, baseUrl } = parseArgs()
  const dateDir = path.join(OUT_DIR, date)
  if (!fs.existsSync(dateDir)) {
    console.error('폴더 없음:', dateDir, '— 먼저 generate-sns-daily.mjs 실행')
    process.exit(1)
  }

  const dryRun = getEnv('SNS_PUBLISH_DRY_RUN', 'true') === 'true'
  if (dryRun) console.log('SNS_PUBLISH_DRY_RUN=true — 실제 게시 안 함\n')

  const chars = character === 'both' ? ['sua', 'ethan'] : [character]
  for (const c of chars) {
    await publishOne(c, dateDir, baseUrl, dryRun)
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
