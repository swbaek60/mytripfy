/**
 * 이메일로 회원 삭제 (auth.users + public 테이블).
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 *
 * 사용: node --env-file=.env.local scripts/delete-user-by-email.mjs [email]
 * 예:   node --env-file=.env.local scripts/delete-user-by-email.mjs bmjhkhr@gmail.com
 */

import { createClient } from '@supabase/supabase-js'

const email = process.argv[2] || 'bmjhkhr@gmail.com'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local 확인)')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)
const uid = await findUserIdByEmail(admin, email)
if (!uid) {
  console.error('해당 이메일 회원 없음:', email)
  process.exit(1)
}

console.log('회원 ID:', uid, '- 관련 데이터 삭제 중...')

// FK 순서 고려: 참조당하는 테이블 먼저, profiles / auth.users 는 마지막
const tablesWithUserId = [
  'notifications',
  'challenge_certifications',
  'guide_applications',
  'companion_applications',
  'chat_participants',
  'sponsor_visits',
  'sponsor_visit_disputes',
  'dispute_votes',
  'challenge_disputes',
  'sponsors',
  'guide_requests',
  'companion_posts',
  'visited_countries',
]

for (const table of tablesWithUserId) {
  const col = table === 'challenge_disputes' ? 'cert_user_id' : 'user_id'
  try {
    const { error } = await admin.from(table).delete().eq(col, uid)
    if (error) {
      if (error.code === '42P01') continue // 테이블 없음
      console.warn(`  ${table}:`, error.message)
    } else {
      console.log('  -', table)
    }
  } catch (e) {
    console.warn('  ', table, e.message)
  }
}

// messages (sender_id)
try {
  const { error: msgErr } = await admin.from('messages').delete().eq('sender_id', uid)
  if (!msgErr) console.log('  - messages')
} catch (_) {}

// profiles
const { error: profErr } = await admin.from('profiles').delete().eq('id', uid)
if (profErr) {
  console.error('profiles 삭제 실패:', profErr.message)
  process.exit(1)
}
console.log('  - profiles')

// auth.users
const { error: authErr } = await admin.auth.admin.deleteUser(uid)
if (authErr) {
  console.error('auth.users 삭제 실패:', authErr.message)
  process.exit(1)
}

console.log('완료:', email, '삭제됨.')

async function findUserIdByEmail(supabase, email) {
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('listUsers 실패:', error.message)
      return null
    }
    const user = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (user) return user.id
    if (data.users.length < perPage) return null
    page++
  }
}
