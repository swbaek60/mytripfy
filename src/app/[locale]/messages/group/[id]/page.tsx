import { createClient, createAdminClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/Header'
import GroupChatRoom from './GroupChatRoom'

export default async function GroupChatPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id: chatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in`)

  const admin = createAdminClient()

  // 채팅방 정보 먼저 조회 (참여자 아님에도 등록자면 입장 허용 후 참여자 추가)
  const { data: chat } = await admin
    .from('chats')
    .select('id, name, is_group, type, reference_id, created_by')
    .eq('id', chatId)
    .eq('is_group', true)
    .single()

  if (!chat) notFound()

  let { data: myParticipant } = await admin
    .from('chat_participants')
    .select('user_id')
    .eq('chat_id', chatId)
    .eq('user_id', user.id)
    .maybeSingle()

  // 참여자 목록에 없어도 채팅 생성자(등록자)면 입장 허용 + 참여자로 추가 (과거 생성 시 누락 보정)
  if (!myParticipant && chat.created_by === user.id) {
    await admin.from('chat_participants').upsert({ chat_id: chatId, user_id: user.id })
    myParticipant = { user_id: user.id }
  }

  // 게시글 소유자이지만 created_by 없을 수 있는 경우: reference_id로 확인 후 허용
  if (!myParticipant && chat.reference_id) {
    const { data: post } = await admin
      .from('companion_posts')
      .select('user_id')
      .eq('id', chat.reference_id)
      .single()
    if (post?.user_id === user.id) {
      await admin.from('chat_participants').upsert({ chat_id: chatId, user_id: user.id })
      myParticipant = { user_id: user.id }
    }
  }

  if (!myParticipant) redirect(`/${locale}/companions`)

  // 채팅방 입장 시 읽음 처리 (배지 숫자 즉시 0으로 반영되도록 서버에서 처리)
  const now = new Date().toISOString()
  await admin
    .from('chat_participants')
    .update({ last_read_at: now })
    .eq('chat_id', chatId)
    .eq('user_id', user.id)
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('type', 'message')
    .eq('reference_type', 'group_chat')
    .eq('reference_id', chatId)
    .eq('is_read', false)

  const { data: participants } = await admin
    .from('chat_participants')
    .select('user_id, joined_at')
    .eq('chat_id', chatId)
    .order('joined_at', { ascending: true })

  const { data: messages } = await admin
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(100)

  const participantIds = (participants ?? []).map(p => p.user_id).filter(Boolean)
  const senderIds = (messages ?? []).map(m => m.sender_id).filter(Boolean)
  const allUserIds = [...new Set([...participantIds, ...senderIds])].map(id => String(id).trim()).filter(Boolean)
  const norm = (id: string) => String(id ?? '').toLowerCase()
  let profileRows: { id: string; full_name: string | null; avatar_url: string | null; travel_level: number | null }[] = []
  if (allUserIds.length > 0) {
    const { data, error } = await admin.from('profiles').select('id, full_name, avatar_url, travel_level').in('id', allUserIds)
    if (!error) profileRows = (data ?? []) as typeof profileRows
  }
  const profileByUserId: Record<string, { id: string; full_name: string | null; avatar_url: string | null; travel_level: number | null }> = {}
  for (const row of profileRows) {
    if (row?.id == null) continue
    const key = norm(row.id)
    profileByUserId[key] = {
      id: String(row.id),
      full_name: row.full_name ?? null,
      avatar_url: row.avatar_url ?? null,
      travel_level: row.travel_level ?? null,
    }
  }
  const members = (participants ?? []).map(p => ({
    user_id: p.user_id,
    joined_at: p.joined_at,
    profiles: profileByUserId[norm(p.user_id)] ?? null,
  }))
  const seenSenderIds = new Set(participantIds.map(norm))
  for (const senderId of senderIds) {
    const n = norm(senderId)
    if (seenSenderIds.has(n)) continue
    seenSenderIds.add(n)
    members.push({
      user_id: senderId,
      joined_at: '',
      profiles: profileByUserId[n] ?? null,
    })
  }

  const postId = chat.reference_id ?? null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} locale={locale} />
      <GroupChatRoom
        chatId={chatId}
        chatName={chat.name || 'Trip Group Chat'}
        postId={postId}
        currentUserId={user.id}
        hostId={chat.created_by ?? ''}
        initialMessages={messages ?? []}
        initialMembers={(members ?? []) as any}
        locale={locale}
      />
    </div>
  )
}
