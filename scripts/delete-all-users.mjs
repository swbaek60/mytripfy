/**
 * 회원가입한 사람 전부 DB에서 삭제 (public 데이터 + auth.users)
 * FK 순서대로 테이블 비운 뒤 profiles 삭제, 마지막에 Auth 사용자 삭제.
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 *
 * 사용: node --env-file=.env.local scripts/delete-all-users.mjs
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

async function deleteAll(table, label, idColumn = 'id') {
  let total = 0
  for (;;) {
    const { data: rows } = await admin.from(table).select(idColumn).limit(BATCH)
    if (!rows?.length) break
    const ids = rows.map((r) => r[idColumn])
    const { error } = await admin.from(table).delete().in(idColumn, ids)
    if (error) {
      if (error.code === '42P01') return
      console.error(`${table} 삭제 실패:`, error.message)
      return
    }
    total += ids.length
  }
  if (total > 0) console.log(`  ${label}: ${total}행`)
}

async function deleteChallengeWishes() {
  let total = 0
  for (;;) {
    const { data: rows } = await admin.from('challenge_wishes').select('user_id').limit(BATCH)
    if (!rows?.length) break
    const userIds = [...new Set(rows.map((r) => r.user_id))]
    const { error } = await admin.from('challenge_wishes').delete().in('user_id', userIds)
    if (error) {
      console.error('challenge_wishes 삭제 실패:', error.message)
      return
    }
    total += userIds.length
  }
  if (total > 0) console.log('  challenge_wishes:', total, '행')
}

async function run() {
  console.log('1. public 테이블 데이터 삭제 (FK 순서)...\n')

  await deleteAll('dispute_votes', 'dispute_votes')
  await deleteAll('challenge_disputes', 'challenge_disputes')
  await deleteAll('sponsor_visit_disputes', 'sponsor_visit_disputes')
  await deleteAll('sponsor_visits', 'sponsor_visits')
  await deleteAll('notifications', 'notifications')
  await deleteAll('messages', 'messages')
  await deleteAll('chat_participants', 'chat_participants')
  await deleteAll('companion_questions', 'companion_questions')
  await deleteAll('companion_applications', 'companion_applications')
  await deleteAll('reviews', 'reviews')
  await deleteAll('bookmarks', 'bookmarks')
  await deleteAll('trip_activities', 'trip_activities')
  await deleteAll('trip_days', 'trip_days')
  await deleteAll('trips', 'trips')
  await deleteAll('guide_applications', 'guide_applications')
  await deleteAll('guide_requests', 'guide_requests')
  await deleteAll('challenge_certifications', 'challenge_certifications')
  await deleteChallengeWishes()
  await deleteAll('sponsor_benefits', 'sponsor_benefits')
  await deleteAll('sponsors', 'sponsors')

  const { error: unlinkErr } = await admin.from('companion_posts').update({ group_chat_id: null }).not('group_chat_id', 'is', null)
  if (unlinkErr) console.error('companion_posts group_chat_id 해제 실패:', unlinkErr.message)

  await deleteAll('chats', 'chats')
  await deleteAll('companion_posts', 'companion_posts')
  await deleteAll('visited_countries', 'visited_countries')

  try {
    await deleteAll('travel_personalities', 'travel_personalities')
  } catch (_) {}
  try {
    await deleteAll('bucket_list', 'bucket_list')
  } catch (_) {}

  console.log('\n2. profiles 삭제...')
  await deleteAll('profiles', 'profiles')

  console.log('\n3. Auth 사용자 삭제...')
  let page = 1
  const perPage = 1000
  let authDeleted = 0
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('listUsers 실패:', error.message)
      break
    }
    if (!data?.users?.length) break
    for (const user of data.users) {
      const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
      if (delErr) console.error('  deleteUser 실패:', user.id, delErr.message)
      else authDeleted++
    }
    if (data.users.length < perPage) break
    page++
  }
  console.log('  auth.users 삭제:', authDeleted, '명')

  console.log('\n회원 전체 삭제 완료.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
