/**
 * 읽지 않은 메시지 알림 확인
 * 사용: node --env-file=.env.local scripts/check-unread-notifications.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(supabaseUrl, serviceRoleKey)

// 읽지 않은 메시지 알림
const { data: unread } = await admin
  .from('notifications')
  .select('id, user_id, type, title, message, reference_id, reference_type, is_read, created_at')
  .eq('type', 'message')
  .eq('is_read', false)
  .order('created_at', { ascending: false })

console.log('읽지 않은 메시지 알림:')
console.log(JSON.stringify(unread, null, 2))

// 사용자별 집계
const byUser = {}
for (const n of unread ?? []) {
  byUser[n.user_id] = (byUser[n.user_id] || 0) + 1
}
console.log('\n사용자별 미읽음 수:')
for (const [userId, count] of Object.entries(byUser)) {
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', userId).single()
  console.log(`  ${profile?.full_name || userId}: ${count}개`)
}

// 채팅방 참여자 현황
console.log('\n현재 1:1 채팅방 참여자 현황:')
const { data: chats } = await admin.from('chats').select('id, type').or('is_group.is.null,is_group.eq.false')
for (const chat of chats ?? []) {
  const { data: parts } = await admin.from('chat_participants').select('user_id, profiles(full_name)').eq('chat_id', chat.id)
  const names = parts?.map(p => {
    const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
    return prof?.full_name || p.user_id
  })
  console.log(`  채팅방 ${chat.id.slice(0,8)}: ${names?.join(', ')} (${parts?.length}명)`)
}
