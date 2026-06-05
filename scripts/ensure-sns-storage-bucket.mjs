#!/usr/bin/env node
import './lib/load-sns-env.mjs'
import { getEnv, requireEnv } from './lib/sns-env.mjs'

async function main() {
  const url = requireEnv('SUPABASE_URL').replace(/\/$/, '')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const bucket = getEnv('SNS_STORAGE_BUCKET', 'sns')

  const listRes = await fetch(`${url}/storage/v1/bucket`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  })
  const buckets = await listRes.json()
  const exists = Array.isArray(buckets) && buckets.some((b) => b.name === bucket || b.id === bucket)

  if (!exists) {
    const createRes = await fetch(`${url}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: bucket, public: true }),
    })
    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error('bucket create: ' + err)
    }
    console.log('버킷 생성:', bucket, '(public)')
  } else {
    console.log('버킷 있음:', bucket)
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
