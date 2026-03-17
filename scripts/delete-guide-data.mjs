/**
 * Find Local Guides - 가이드 요청/신청 데이터 전부 DB에서 삭제
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 *
 * 사용: node --env-file=.env.local scripts/delete-guide-data.mjs
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

async function run() {
  // 1. 가이드 신청 삭제 (guide_requests FK 먼저 해제)
  await deleteAll('guide_applications', 'guide_applications')

  // 2. 가이드 찾기 요청글 삭제
  await deleteAll('guide_requests', 'guide_requests')

  console.log('Find Local Guides 데이터 DB 삭제 완료.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
