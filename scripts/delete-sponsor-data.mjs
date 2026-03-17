/**
 * Sponsors 페이지 스폰서 글 전부 DB에서 삭제
 * FK 순서: sponsor_visit_disputes → sponsor_visits → sponsor_benefits → sponsors
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 *
 * 사용: node --env-file=.env.local scripts/delete-sponsor-data.mjs
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
  // 1. 스폰서 방문 분쟁
  await deleteAll('sponsor_visit_disputes', 'sponsor_visit_disputes')

  // 2. 스폰서 방문 인증 (매장 사진 인증)
  await deleteAll('sponsor_visits', 'sponsor_visits')

  // 3. 스폰서 혜택 (쿠폰 등)
  await deleteAll('sponsor_benefits', 'sponsor_benefits')

  // 4. 스폰서 매장/업체
  await deleteAll('sponsors', 'sponsors')

  console.log('Sponsors 데이터 DB 삭제 완료.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
