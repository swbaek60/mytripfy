#!/usr/bin/env node
/**
 * scripts/out/YYYY-MM-DD/*.png → Supabase Storage public bucket 업로드
 * .env.sns: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SNS_STORAGE_BUCKET=sns
 *
 *   node scripts/upload-sns-images.mjs --date=2026-05-21
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getEnv, requireEnv } from './lib/sns-env.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')

async function uploadFile(supabaseUrl, key, bucket, filePath, serviceKey) {
  const body = fs.readFileSync(filePath)
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body,
  })
  if (!res.ok) throw new Error(await res.text())
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${key}`
}

async function main() {
  let date = new Date().toISOString().slice(0, 10)
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--date=')) date = a.slice(7)
  }
  const dateDir = path.join(OUT_DIR, date)
  if (!fs.existsSync(dateDir)) {
    console.error('없음:', dateDir)
    process.exit(1)
  }

  const supabaseUrl = requireEnv('SUPABASE_URL').replace(/\/$/, '')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const bucket = getEnv('SNS_STORAGE_BUCKET', 'sns')

  const files = fs.readdirSync(dateDir).filter((f) => f.endsWith('.png'))
  const publicUrls = []
  for (const f of files) {
    const key = `${date}/${f}`
    const url = await uploadFile(supabaseUrl, key, bucket, path.join(dateDir, f), serviceKey)
    publicUrls.push(url)
    console.log('OK', f, '→', url)
  }

  console.log('\n.env.sns SNS_IMAGE_BASE_URL=')
  console.log(`${supabaseUrl}/storage/v1/object/public/${bucket}/`)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
