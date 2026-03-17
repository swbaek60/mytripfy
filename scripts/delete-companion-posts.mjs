/**
 * 동행 찾기(companion_posts) 게시글 전부 DB에서 삭제
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 *
 * 사용: node --env-file=.env.local scripts/delete-companion-posts.mjs
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
  // 1. 동행 게시글 그룹채팅 연결 해제 (FK 방지)
  const { error: uErr } = await admin.from('companion_posts').update({ group_chat_id: null }).not('group_chat_id', 'is', null)
  if (uErr) console.error('group_chat_id 해제 실패:', uErr.message)

  // 2. 동행 Q&A 삭제
  await deleteAll('companion_questions', 'companion_questions')

  // 3. 동행 신청 삭제
  await deleteAll('companion_applications', 'companion_applications')

  // 4. 동행 게시글 삭제
  await deleteAll('companion_posts', 'companion_posts')

  console.log('동행 찾기 게시글 DB 삭제 완료.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
