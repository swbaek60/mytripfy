#!/usr/bin/env node
/**
 * Meta long-lived User Access Token 갱신
 *   node scripts/refresh-meta-token.mjs --token=SHORT_LIVED_TOKEN
 *
 * 결과를 .env.sns 의 META_ACCESS_TOKEN 에 저장 (수동 붙여넣기)
 */
import { META_GRAPH, getEnv } from './lib/sns-env.mjs'

function parseArgs() {
  let token = ''
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--token=')) token = a.slice(8)
  }
  return token
}

async function main() {
  const shortToken = parseArgs() || getEnv('META_SHORT_LIVED_TOKEN')
  const appId = getEnv('META_APP_ID')
  const appSecret = getEnv('META_APP_SECRET')
  if (!shortToken || !appId || !appSecret) {
    console.error('필요: --token= 또는 META_SHORT_LIVED_TOKEN, META_APP_ID, META_APP_SECRET (.env.sns)')
    process.exit(1)
  }

  const url =
    META_GRAPH +
    '/oauth/access_token?' +
    new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    })

  const res = await fetch(url)
  const json = await res.json()
  if (json.error) {
    console.error(json.error.message)
    process.exit(1)
  }

  console.log('Long-lived token (약 60일):')
  console.log(json.access_token)
  console.log('\n.env.sns 에 저장:')
  console.log('META_ACCESS_TOKEN=' + json.access_token)
  if (json.expires_in) console.log('expires_in:', json.expires_in, 'seconds')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
