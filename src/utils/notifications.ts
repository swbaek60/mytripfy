import { createClient } from '@/utils/supabase/server'

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .neq('type', 'message')  // 메시지 알림은 메시지 배지에서 따로 처리
  return count || 0
}

/**
 * 실제 읽지 않은 메시지 수 (messages + last_read_at 기준).
 * 정확한 배지: Supabase SQL Editor에서 supabase/schema-v43-unread-message-count.sql 실행 권장.
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_unread_message_count', { p_user_id: userId })
  if (error) {
    // RPC 미적용 시: 참여 중인 채팅이 없으면 0, 있으면 notifications 기준
    const { count: participantCount } = await supabase
      .from('chat_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (participantCount === 0) return 0
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('type', 'message')
    return count || 0
  }
  return typeof data === 'number' ? data : Number(data ?? 0)
}
