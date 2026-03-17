/**
 * 메시지 트리거/알림 동작 확인 스크립트
 * 사용: node --env-file=.env.local scripts/check-message-trigger.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(supabaseUrl, serviceRoleKey)

// 1. 최근 messages 5개 조회
const { data: msgs } = await admin
  .from('messages')
  .select('id, chat_id, sender_id, created_at')
  .order('created_at', { ascending: false })
  .limit(5)

console.log('최근 메시지 5개:')
console.log(msgs)

// 3. 최근 notifications 5개 (type=message)
const { data: notifs } = await admin
  .from('notifications')
  .select('id, user_id, type, title, reference_id, reference_type, is_read, created_at')
  .eq('type', 'message')
  .order('created_at', { ascending: false })
  .limit(5)

console.log('\n최근 메시지 알림 5개:')
console.log(notifs)

// 4. chat_participants 확인 (최근 메시지의 채팅방)
if (msgs?.[0]) {
  const { data: parts } = await admin
    .from('chat_participants')
    .select('user_id, last_read_at')
    .eq('chat_id', msgs[0].chat_id)
  console.log('\n해당 채팅방 참여자:')
  console.log(parts)
}
