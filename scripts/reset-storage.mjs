/**
 * Storage 버킷 내 모든 파일 삭제 (테스트 데이터 초기화용)
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 *
 * 사용: node --env-file=.env.local scripts/reset-storage.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local 확인)')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const BUCKETS = ['avatars', 'photos', 'certifications', 'guide-media']

async function listAllObjects(bucketId) {
  const list = []
  let offset = 0
  const limit = 1000
  while (true) {
    const { data, error } = await admin.storage.from(bucketId).list('', { limit, offset })
    if (error) throw error
    if (!data?.length) break
    for (const item of data) {
      if (item.id) list.push(item.name)
      else list.push(item.name + '/') // folder
    }
    offset += data.length
    if (data.length < limit) break
  }
  return list
}

async function deleteRecursive(bucketId, prefix = '') {
  const { data: items, error: listErr } = await admin.storage.from(bucketId).list(prefix, { limit: 1000 })
  if (listErr) throw listErr
  if (!items?.length) return
  const files = items.filter((i) => i.id).map((i) => (prefix ? `${prefix}/${i.name}` : i.name))
  const folders = items.filter((i) => !i.id)
  if (files.length) {
    const { error: delErr } = await admin.storage.from(bucketId).remove(files)
    if (delErr) throw delErr
    console.log(`  삭제: ${files.length}개 파일`)
  }
  for (const folder of folders) {
    const subPrefix = prefix ? `${prefix}/${folder.name}` : folder.name
    await deleteRecursive(bucketId, subPrefix)
  }
}

console.log('Storage 버킷 초기화 중...\n')

for (const bucketId of BUCKETS) {
  try {
    const { data: exists } = await admin.storage.getBucket(bucketId)
    if (!exists) {
      console.log(`[${bucketId}] 버킷 없음, 스킵`)
      continue
    }
    console.log(`[${bucketId}]`)
    await deleteRecursive(bucketId)
    console.log(`[${bucketId}] 완료\n`)
  } catch (e) {
    console.error(`[${bucketId}] 오류:`, e.message)
  }
}

console.log('Storage 초기화 끝.')
