/**
 * 참여자가 1명인 1:1 채팅방에 상대방 추가
 * 사용: node --env-file=.env.local scripts/fix-chat-participants.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(supabaseUrl, serviceRoleKey)

// 참여자가 1명인 1:1 채팅방 조회
const { data: allChats } = await admin
  .from('chats')
  .select('id, type, is_group, created_at')
  .or('is_group.is.null,is_group.eq.false')

for (const chat of allChats ?? []) {
  const { data: parts } = await admin
    .from('chat_participants')
    .select('user_id')
    .eq('chat_id', chat.id)

  if ((parts?.length ?? 0) >= 2) continue

  console.log(`\n채팅방 ${chat.id} - 참여자 ${parts?.length ?? 0}명`)
  const existingUserId = parts?.[0]?.user_id
  console.log(`현재 참여자: ${existingUserId}`)

  // 메시지에서 다른 sender 찾기
  const { data: msgs } = await admin
    .from('messages')
    .select('sender_id')
    .eq('chat_id', chat.id)
    .neq('sender_id', existingUserId)
    .limit(1)

  if (msgs?.[0]?.sender_id) {
    const otherUserId = msgs[0].sender_id
    console.log(`메시지에서 발견한 상대방: ${otherUserId}`)

    // 상대방 프로필 확인
    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('id', otherUserId)
      .single()
    console.log(`상대방 이름: ${profile?.full_name}`)

    // 상대방을 채팅 참여자로 추가
    const { error } = await admin
      .from('chat_participants')
      .insert({ chat_id: chat.id, user_id: otherUserId })

    if (error) {
      console.error(`추가 실패:`, error.message)
    } else {
      console.log(`✅ 상대방 ${otherUserId} 추가 완료`)
    }
  } else {
    console.log(`메시지에서 상대방을 찾을 수 없음 - 메시지가 없거나 모두 같은 사람이 보냄`)
    
    // notifications에서 수신자 찾기
    const { data: notifs } = await admin
      .from('notifications')
      .select('user_id')
      .eq('reference_type', 'user')
      .eq('reference_id', existingUserId)
      .eq('type', 'message')
      .limit(1)
    
    if (notifs?.[0]?.user_id) {
      const recipientId = notifs[0].user_id
      console.log(`알림에서 발견한 수신자: ${recipientId}`)
      
      const { error } = await admin
        .from('chat_participants')
        .insert({ chat_id: chat.id, user_id: recipientId })
      
      if (error) {
        console.error(`추가 실패:`, error.message)
      } else {
        console.log(`✅ 수신자 ${recipientId} 추가 완료`)
      }
    } else {
      console.log(`⚠️ 상대방을 특정할 수 없음 - 수동 확인 필요`)
    }
  }
}

console.log('\n완료!')
