import { NextResponse } from 'next/server'
import { createClient, createAdminClient, getAuthUser } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { appId, applicantId, status, postId, groupChatId } = await req.json()

    if (!appId || !applicantId || !status || !postId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 현재 로그인 사용자 확인
    const supabase = await createClient()
    const authUser = await getAuthUser()
    const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 호스트인지 확인
    const { data: post } = await supabase
      .from('companion_posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (!post || post.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: not the post owner' }, { status: 403 })
    }

    // 서비스 역할로 상태 변경 (RLS 우회)
    const admin = createAdminClient()

    const { error: updateError } = await admin
      .from('companion_applications')
      .update({ status })
      .eq('id', appId)

    if (updateError) {
      console.error('updateError:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 수락 시 그룹 채팅방에 자동 추가
    if (status === 'accepted' && groupChatId) {
      await admin
        .from('chat_participants')
        .upsert({ chat_id: groupChatId, user_id: applicantId })
    }

    // 거절/기타 시 그룹 채팅방에서 제거
    if (status === 'rejected' && groupChatId) {
      await admin
        .from('chat_participants')
        .delete()
        .eq('chat_id', groupChatId)
        .eq('user_id', applicantId)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('application-status error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
