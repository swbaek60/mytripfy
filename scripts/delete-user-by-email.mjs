/**
 * 이메일로 회원 및 관련 데이터 전부 삭제 (profiles + Clerk + legacy auth).
 * SUPABASE_SERVICE_ROLE_KEY 필요. Clerk 삭제는 CLERK_SECRET_KEY 있을 때 수행.
 *
 * 사용: node --env-file=.env.local scripts/delete-user-by-email.mjs harry@mytripfy.com
 */

import { createClient } from '@supabase/supabase-js'

const email = (process.argv[2] || '').trim().toLowerCase()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const clerkSecretKey = process.env.CLERK_SECRET_KEY

if (!email) {
  console.error('이메일 필요: node scripts/delete-user-by-email.mjs user@example.com')
  process.exit(1)
}
if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local 확인)')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const { data: profile, error: profileLookupErr } = await admin
  .from('profiles')
  .select('id, full_name, email, clerk_id')
  .ilike('email', email)
  .maybeSingle()

if (profileLookupErr) {
  console.error('profiles 조회 실패:', profileLookupErr.message)
  process.exit(1)
}
if (!profile) {
  console.error('해당 이메일 회원 없음:', email)
  process.exit(1)
}

const uid = profile.id
console.log('회원:', profile.full_name || '(이름 없음)', profile.email, uid)
if (profile.clerk_id) console.log('Clerk ID:', profile.clerk_id)
console.log('관련 데이터 삭제 중...\n')

async function del(table, filter) {
  const q = admin.from(table).delete()
  for (const [col, val] of Object.entries(filter)) {
    if (val === 'IN_POSTS') {
      const { data: posts } = await admin.from('companion_posts').select('id').eq('user_id', uid)
      const ids = (posts ?? []).map(p => p.id)
      if (!ids.length) return
      q.in(col, ids)
    } else if (val === 'IN_TRIPS') {
      const { data: trips } = await admin.from('trips').select('id').eq('user_id', uid)
      const ids = (trips ?? []).map(t => t.id)
      if (!ids.length) return
      q.in(col, ids)
    } else if (val === 'IN_SPONSORS') {
      const { data: sponsors } = await admin.from('sponsors').select('id').eq('user_id', uid)
      const ids = (sponsors ?? []).map(s => s.id)
      if (!ids.length) return
      q.in(col, ids)
    } else if (val === 'IN_GUIDE_REQUESTS') {
      const { data: reqs } = await admin.from('guide_requests').select('id').eq('user_id', uid)
      const ids = (reqs ?? []).map(r => r.id)
      if (!ids.length) return
      q.in(col, ids)
    } else {
      q.eq(col, val)
    }
  }
  const { error, count } = await q.select('id', { count: 'exact', head: true })
  if (error) {
    if (error.code === '42P01') return
    console.warn(`  ${table}:`, error.message)
  } else {
    console.log(`  - ${table}${count != null ? ` (${count})` : ''}`)
  }
}

async function delOr(table, col, val) {
  const { error } = await admin.from(table).delete().eq(col, val)
  if (error && error.code !== '42P01') console.warn(`  ${table}.${col}:`, error.message)
  else if (!error) console.log(`  - ${table} (${col})`)
}

// FK 순서
await delOr('dispute_votes', 'cert_user_id', uid)
await delOr('dispute_votes', 'voter_id', uid)
await delOr('challenge_disputes', 'cert_user_id', uid)
await delOr('challenge_disputes', 'reporter_id', uid)
await delOr('sponsor_visit_disputes', 'reporter_id', uid)
await delOr('sponsor_visits', 'user_id', uid)

await delOr('notifications', 'user_id', uid)
await delOr('challenge_certifications', 'user_id', uid)
await delOr('challenge_wishes', 'user_id', uid)
await delOr('user_challenges', 'user_id', uid)

await delOr('companion_questions', 'question_user_id', uid)
await delOr('companion_questions', 'answer_user_id', uid)
await del('companion_questions', { post_id: 'IN_POSTS' })

await delOr('companion_applications', 'applicant_id', uid)
await del('companion_applications', { post_id: 'IN_POSTS' })

await delOr('reviews', 'reviewer_id', uid)
await delOr('reviews', 'reviewee_id', uid)
await delOr('bookmarks', 'user_id', uid)

// trips → days → activities
const { data: tripDays } = await admin
  .from('trip_days')
  .select('id, trip_id')
  .in('trip_id', (await admin.from('trips').select('id').eq('user_id', uid)).data?.map(t => t.id) ?? [])

if (tripDays?.length) {
  const dayIds = tripDays.map(d => d.id)
  const { error: actErr } = await admin.from('trip_activities').delete().in('day_id', dayIds)
  if (!actErr) console.log('  - trip_activities')
  const tripIds = [...new Set(tripDays.map(d => d.trip_id))]
  const { error: dayErr } = await admin.from('trip_days').delete().in('trip_id', tripIds)
  if (!dayErr) console.log('  - trip_days')
}
await delOr('trips', 'user_id', uid)

await delOr('guide_applications', 'guide_id', uid)
await del('guide_applications', { request_id: 'IN_GUIDE_REQUESTS' })
await delOr('guide_requests', 'user_id', uid)

await delOr('messages', 'sender_id', uid)
await delOr('chat_participants', 'user_id', uid)

await admin.from('companion_posts').update({ group_chat_id: null }).eq('user_id', uid)
await delOr('companion_posts', 'user_id', uid)

await del('sponsor_benefits', { sponsor_id: 'IN_SPONSORS' })
await delOr('sponsors', 'user_id', uid)
await delOr('visited_countries', 'user_id', uid)

try {
  await delOr('bucket_list', 'user_id', uid)
} catch {}
try {
  await delOr('travel_personalities', 'user_id', uid)
} catch {}

const { error: profErr } = await admin.from('profiles').delete().eq('id', uid)
if (profErr) {
  console.error('\nprofiles 삭제 실패:', profErr.message)
  process.exit(1)
}
console.log('  - profiles')

// Legacy Supabase Auth (Clerk 이전 계정)
const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
const authUser = authList?.users?.find(u => (u.email || '').toLowerCase() === email)
if (authUser) {
  const { error: authErr } = await admin.auth.admin.deleteUser(authUser.id)
  if (authErr) console.warn('auth.users 삭제:', authErr.message)
  else console.log('  - auth.users')
}

// Clerk
if (profile.clerk_id && clerkSecretKey) {
  const res = await fetch(`https://api.clerk.com/v1/users/${profile.clerk_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${clerkSecretKey}` },
  })
  if (!res.ok) {
    const body = await res.text()
    console.warn('Clerk 삭제 실패:', res.status, body)
  } else {
    console.log('  - Clerk user')
  }
} else if (profile.clerk_id && !clerkSecretKey) {
  console.warn('CLERK_SECRET_KEY 없음 — Clerk 계정은 수동 삭제 필요:', profile.clerk_id)
}

console.log('\n완료:', email, '삭제됨.')
