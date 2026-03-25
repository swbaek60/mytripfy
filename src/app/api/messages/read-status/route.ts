import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

/**
 * GET /api/messages/read-status?chatId=xxx
 * 채팅방 참여자들의 last_read_at 목록 반환 (읽음 표시용)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    if (!chatId) return NextResponse.json({ error: 'chatId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    // 모든 참여자의 last_read_at 조회
    const { data: participants, error } = await admin
      .from('chat_participants')
      .select('user_id, last_read_at')
      .eq('chat_id', chatId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ participants: participants ?? [] })
  } catch (e) {
    console.error('read-status error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
