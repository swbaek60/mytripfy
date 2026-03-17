/**
 * 채팅방 참여자 누락 확인 스크립트
 * 사용: node --env-file=.env.local scripts/check-chat-participants.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(supabaseUrl, serviceRoleKey)

// 1:1 채팅방 중 참여자가 1명인 방 찾기
const { data: allChats } = await admin
  .from('chats')
  .select('id, type, is_group, created_at')
  .or('is_group.is.null,is_group.eq.false')

console.log(`전체 1:1 채팅방 수: ${allChats?.length ?? 0}`)

let singleParticipantChats = []
for (const chat of allChats ?? []) {
  const { data: parts } = await admin
    .from('chat_participants')
    .select('user_id')
    .eq('chat_id', chat.id)
  
  if ((parts?.length ?? 0) < 2) {
    singleParticipantChats.push({
      chatId: chat.id,
      participantCount: parts?.length ?? 0,
      participants: parts?.map(p => p.user_id),
      created_at: chat.created_at
    })
  }
}

console.log(`\n참여자가 2명 미만인 채팅방:`)
console.log(JSON.stringify(singleParticipantChats, null, 2))
