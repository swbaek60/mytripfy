import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { chatId, content } = await req.json()

    if (!chatId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing chatId or content' }, { status: 400 })
    }

    // 현재 로그인 사용자 확인 (세션만 사용자 클라이언트로)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 참여자 확인 + 메시지 삽입은 모두 admin으로 (RLS/정책 변경 영향 없이 동일 동작)
    const admin = createAdminClient()
    const { data: participant } = await admin
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 })
    }

    // 서비스 역할로 메시지 삽입 (RLS 우회)
    const { data, error } = await admin
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('message insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: data })
  } catch (e) {
    console.error('group-chat/send error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
