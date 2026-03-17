/**
 * 챌린지 인증 데이터 + certifications 버킷 사진 전부 삭제
 * FK 순서: dispute_votes → challenge_disputes → challenge_certifications
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 *
 * 사용: node --env-file=.env.local scripts/delete-challenge-certifications.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local 확인)')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const BATCH = 200

async function deleteAll(table, label) {
  let total = 0
  for (;;) {
    const { data: rows } = await admin.from(table).select('id').limit(BATCH)
    if (!rows?.length) break
    const ids = rows.map((r) => r.id)
    const { error } = await admin.from(table).delete().in('id', ids)
    if (error) {
      console.error(`${table} 삭제 실패:`, error.message)
      return
    }
    total += ids.length
  }
  console.log(`${label} 삭제: ${total}행`)
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
  }
  for (const folder of folders) {
    const subPrefix = prefix ? `${prefix}/${folder.name}` : folder.name
    await deleteRecursive(bucketId, subPrefix)
  }
}

async function run() {
  // 1. 챌린지 인증 관련 투표
  await deleteAll('dispute_votes', 'dispute_votes')

  // 2. 챌린지 딴지(신고)
  await deleteAll('challenge_disputes', 'challenge_disputes')

  // 3. 챌린지 인증
  await deleteAll('challenge_certifications', 'challenge_certifications')

  // 4. certifications 버킷 사진 전부 삭제
  const bucketId = 'certifications'
  try {
    const { data: exists } = await admin.storage.getBucket(bucketId)
    if (!exists) {
      console.log(`[${bucketId}] 버킷 없음, 스킵`)
    } else {
      await deleteRecursive(bucketId)
      console.log(`[${bucketId}] Storage 삭제 완료`)
    }
  } catch (e) {
    console.error(`[${bucketId}] Storage 오류:`, e.message)
  }

  console.log('챌린지 인증 데이터·사진 삭제 완료.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
