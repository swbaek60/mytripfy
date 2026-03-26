import { NextResponse } from 'next/server'
import { createClient, createAdminClient, getAuthUser } from '@/utils/supabase/server'

/** 그룹 채팅 메시지 목록 (참여자만, RLS 우회로 등록자/신청자 동일 결과) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    if (!chatId) return NextResponse.json({ error: 'Missing chatId' }, { status: 400 })

    const supabase = await createClient()
    const authUser = await getAuthUser()
    const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: participant } = await admin
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!participant) return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 })

    const { data: messages, error } = await admin
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('group-chat/messages error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: messages ?? [] })
  } catch (e) {
    console.error('group-chat/messages error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
