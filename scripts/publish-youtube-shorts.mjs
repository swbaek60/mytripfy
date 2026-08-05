#!/usr/bin/env node
/**
 * YouTube Shorts 업로드 (Reels mp4 재활용)
 *
 * 사전: OAuth로 refresh token 발급 후 .env.sns 에 저장
 *   node scripts/youtube-oauth-setup.mjs --character=sua
 *
 *   node scripts/publish-youtube-shorts.mjs --date=2026-05-21 --character=sua --file=scripts/out/2026-05-21/sua-reels.mp4
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getEnv, getYouTubeAccounts } from './lib/sns-env.mjs'
import { BRAND } from './lib/sns-campaign-config.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs() {
  let date = new Date().toISOString().slice(0, 10)
  let character = 'sua'
  let file = ''
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--date=')) date = a.slice(7)
    if (a.startsWith('--character=')) character = a.slice(12)
    if (a.startsWith('--file=')) file = a.slice(7)
  }
  if (!file) file = path.join(__dirname, 'out', date, `${character}-reels.mp4`)
  return { date, character, file }
}

async function getAccessToken(clientId, clientSecret, refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error_description || json.error)
  return json.access_token
}

function buildDescription(character, date) {
  const tags = '#mytripfy #100CountriesChallenge #travel #shorts'
  return (
    (character === 'sua'
      ? `100개국 챌린지 Day — ${date}\n`
      : `100 Countries Challenge — ${date}\n`) +
    BRAND.siteUrl +
    '\n\n' +
    tags
  )
}

async function uploadVideo(accessToken, filePath, title, description) {
  const metadata = {
    snippet: { title, description, categoryId: '19' },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  }

  const boundary = '-------boundary' + Date.now()
  const metaPart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    '\r\n'
  const fileHeader =
    `--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`
  const footer = `\r\n--${boundary}--`

  const metaBuf = Buffer.from(metaPart, 'utf8')
  const fileHeaderBuf = Buffer.from(fileHeader, 'utf8')
  const fileBuf = fs.readFileSync(filePath)
  const footerBuf = Buffer.from(footer, 'utf8')
  const body = Buffer.concat([metaBuf, fileHeaderBuf, fileBuf, footerBuf])

  const res = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || JSON.stringify(json))
  return json
}

async function main() {
  const { date, character, file } = parseArgs()
  if (!fs.existsSync(file)) {
    console.error('영상 파일 없음:', file)
    console.error('CapCut 등으로 캐러셀 이미지 Ken Burns → mp4 저장 후 --file= 지정')
    process.exit(1)
  }

  const dryRun = getEnv('SNS_PUBLISH_DRY_RUN', 'true') === 'true'
  const yt = getYouTubeAccounts()[character]
  if (!yt.refreshToken || !yt.clientId || !yt.clientSecret) {
    console.error('YouTube OAuth 미설정 — scripts/youtube-oauth-setup.mjs 실행')
    process.exit(1)
  }

  const title =
    character === 'sua'
      ? `수아 100개국 Day ${date} #shorts`
      : `Ethan 100 Countries ${date} #shorts`
  const description = buildDescription(character, date)

  if (dryRun) {
    console.log('DRY RUN YouTube Shorts')
    console.log('  file:', file)
    console.log('  title:', title)
    console.log('  description:', description)
    return
  }

  const accessToken = await getAccessToken(yt.clientId, yt.clientSecret, yt.refreshToken)
  const result = await uploadVideo(accessToken, file, title, description)
  console.log('업로드 완료:', result.id, 'https://youtube.com/shorts/' + result.id)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
