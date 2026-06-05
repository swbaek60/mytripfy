#!/usr/bin/env node
/**
 * YouTube OAuth refresh token 1회 발급 가이드
 * Google Cloud Console → OAuth 2.0 → Desktop app
 * Redirect URI: http://localhost:3456/oauth2callback
 *
 *   node scripts/youtube-oauth-setup.mjs
 */
import http from 'http'
import { getEnv } from './lib/sns-env.mjs'

const PORT = 3456
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

function parseArgs() {
  let character = 'sua'
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--character=')) character = a.slice(12)
  }
  return character
}

async function main() {
  const character = parseArgs()
  const clientId = getEnv('YOUTUBE_CLIENT_ID')
  const clientSecret = getEnv('YOUTUBE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    console.error('.env.sns 에 YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET 설정')
    process.exit(1)
  }

  const redirectUri = `http://localhost:${PORT}/oauth2callback`
  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    })

  console.log(`\n[${character}] 브라우저에서 로그인:\n`, authUrl, '\n')

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://localhost:' + PORT)
      if (u.pathname !== '/oauth2callback') return
      const c = u.searchParams.get('code')
      res.end('<h1>OK — 터미널로 돌아가세요</h1>')
      server.close()
      if (c) resolve(c)
      else reject(new Error('no code'))
    })
    server.listen(PORT, () => console.log('대기 중 localhost:' + PORT))
  })

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const json = await tokenRes.json()
  if (json.error) {
    console.error(json.error_description || json.error)
    process.exit(1)
  }

  const key = character === 'sua' ? 'YOUTUBE_SUA_REFRESH_TOKEN' : 'YOUTUBE_ETHAN_REFRESH_TOKEN'
  console.log('\n.env.sns 에 추가:\n')
  console.log(key + '=' + json.refresh_token)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
