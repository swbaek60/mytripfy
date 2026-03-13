import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// DELETE /api/messages/leave?chatId=xxx  → 해당 채팅방에서 나가기 (chat_participants 제거)
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    if (!chatId) return NextResponse.json({ error: 'chatId required' }, { status: 400 })

    const admin = createAdminClient()

    // 참여자인지 확인
    const { data: participant } = await admin
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 })
    }

    // 채팅방 타입 확인 + DM일 때 상대방 ID (참가자 제거 전에 조회)
    const { data: chat } = await admin
      .from('chats')
      .select('is_group, type')
      .eq('id', chatId)
      .single()

    let otherUserId: string | null = null
    if (!chat?.is_group) {
      const { data: others } = await admin
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .neq('user_id', user.id)
      otherUserId = others?.[0]?.user_id ?? null
    }

    // 참가자 제거
    await admin
      .from('chat_participants')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', user.id)

    // 1:1 DM인 경우: 상대방도 없으면 채팅방 자체 삭제
    if (!chat?.is_group) {
      const { count } = await admin
        .from('chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)

      if (!count || count === 0) {
        await admin.from('messages').delete().eq('chat_id', chatId)
        await admin.from('chats').delete().eq('id', chatId)
      }
    }

    // 나간 채팅에 대한 메시지 알림 읽음 처리 → 헤더 배지 숫자 갱신
    if (chat?.is_group) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('type', 'message')
        .eq('reference_type', 'group_chat')
        .eq('reference_id', chatId)
    } else if (otherUserId) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('type', 'message')
        .eq('reference_type', 'user')
        .eq('reference_id', otherUserId)
    }

    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('messages/leave DELETE error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
