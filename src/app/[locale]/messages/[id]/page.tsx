import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import ChatRoom from './ChatRoom'

export default async function MessagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ postId?: string }>
}) {
  const { locale, id: otherUserId } = await params
  const { postId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  if (user.id === otherUserId) redirect(`/${locale}/profile`)

  // 상대방 프로필
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, travel_level, is_guide')
    .eq('id', otherUserId)
    .single()

  if (!otherProfile) redirect(`/${locale}/companions`)

  // ── 방안 A: 두 사람 간 1:1 채팅방은 항상 하나만 유지 ──
  // postId는 여행 컨텍스트 표시용으로만 사용하고, 채팅방 탐색/생성에는 영향 없음
  let chatId: string | null = null

  // 1단계: 내가 속한 채팅방 ID 목록 (admin으로 RLS 우회)
  const admin = createAdminClient()

  const { data: myChats } = await admin
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', user.id)

  const myChatIds = myChats?.map(c => c.chat_id) ?? []

  if (myChatIds.length > 0) {
    // 2단계: 상대방도 속한 채팅방
    const { data: sharedChats } = await admin
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', otherUserId)
      .in('chat_id', myChatIds)

    const sharedChatIds = sharedChats?.map(c => c.chat_id) ?? []

    if (sharedChatIds.length > 0) {
      // 3단계: 그룹 채팅방 제외, 1:1 direct 채팅방만 (타입 무관)
      const { data: directChats } = await admin
        .from('chats')
        .select('id, created_at')
        .in('id', sharedChatIds)
        .or('is_group.is.null,is_group.eq.false')
        .order('created_at', { ascending: false })

      const directChatIds = (directChats ?? []).map(c => c.id)

      if (directChatIds.length > 0) {
        // 가장 최근 메시지가 있는 채팅방 우선, 없으면 가장 최근 생성된 방
        const { data: latestMsg } = await admin
          .from('messages')
          .select('chat_id')
          .in('chat_id', directChatIds)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        chatId = latestMsg?.chat_id ?? directChatIds[0]
      }
    }
  }

  if (!chatId) {
    // 내가 속한 채팅방 중 상대방이 없는 1:1 채팅방이 있으면 재사용 (참여자 누락 복구)
    if (myChatIds.length > 0) {
      const { data: myDirectChats } = await admin
        .from('chats')
        .select('id, created_at')
        .in('id', myChatIds)
        .or('is_group.is.null,is_group.eq.false')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (myDirectChats?.id) {
        chatId = myDirectChats.id
        // 상대방이 참여자에 없으면 추가
        await admin
          .from('chat_participants')
          .upsert({ chat_id: chatId, user_id: otherUserId }, { onConflict: 'chat_id,user_id', ignoreDuplicates: true })
      }
    }

    if (!chatId) {
      // 새 1:1 채팅방 생성 (항상 direct 타입)
      const { data: newChat, error: chatError } = await admin
        .from('chats')
        .insert({ type: 'direct', is_group: false })
        .select('id')
        .single()

      if (!newChat || chatError) {
        console.error('Failed to create chat', chatError)
        throw new Error('채팅방을 생성할 수 없습니다.')
      }

      chatId = newChat.id

      await admin.from('chat_participants').insert([
        { chat_id: chatId, user_id: user.id },
        { chat_id: chatId, user_id: otherUserId },
      ])
    }
  } else {
    // 기존 채팅방이 있어도 상대방이 참여자에 없으면 추가 (누락 복구)
    await admin
      .from('chat_participants')
      .upsert({ chat_id: chatId, user_id: otherUserId }, { onConflict: 'chat_id,user_id', ignoreDuplicates: true })
    await admin
      .from('chat_participants')
      .upsert({ chat_id: chatId, user_id: user.id }, { onConflict: 'chat_id,user_id', ignoreDuplicates: true })
  }

  // 채팅방 입장 시 읽음 처리 (배지 숫자 즉시 0으로 반영되도록 서버에서 처리)
  const now = new Date().toISOString()
  await admin
    .from('chat_participants')
    .update({ last_read_at: now })
    .eq('chat_id', chatId!)
    .eq('user_id', user.id)
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('type', 'message')
    .eq('reference_type', 'user')
    .eq('reference_id', otherUserId)
    .eq('is_read', false)

  // 기존 메시지 조회 (admin으로 RLS 우회)
  const { data: messages } = chatId ? await admin
    .from('messages')
    .select('*, profiles(full_name, avatar_url)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(100) : { data: [] }

  // Trip 컨텍스트: postId가 있으면 동행 포스트 정보 표시용으로 조회
  let trip: { id: string; title: string; destination_country: string | null; start_date: string | null } | null = null
  if (postId) {
    const { data: tripPost } = await supabase
      .from('companion_posts')
      .select('id, title, destination_country, start_date')
      .eq('id', postId)
      .maybeSingle()

    if (tripPost) {
      trip = {
        id: tripPost.id,
        title: tripPost.title,
        destination_country: tripPost.destination_country,
        start_date: tripPost.start_date,
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} locale={locale} />
      <ChatRoom
        chatId={chatId!}
        currentUserId={user.id}
        otherProfile={otherProfile}
        initialMessages={messages || []}
        locale={locale}
        trip={trip}
      />
    </div>
  )
}
