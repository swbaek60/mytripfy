import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import MessagesList from './MessagesList'
import { MessageSquare } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function MessagesPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Messages' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const admin = createAdminClient()

  // 내가 참여한 채팅방 목록 (admin으로 RLS 우회)
  const { data: participations } = await admin
    .from('chat_participants')
    .select('chat_id, chats(id, type, is_group, name, reference_id, created_by)')
    .eq('user_id', user.id)

  // 1:1 채팅방과 그룹 채팅방 분리
  const groupChats: {
    chatId: string
    name: string
    memberCount: number
    lastMessage: string | null
    lastAt: string | null
    postId: string | null
  }[] = []

  const directChats: {
    chatId: string
    other: { id: string; full_name: string | null; avatar_url: string | null } | null
    lastMessage: string | null
    lastAt: string | null
  }[] = []

  for (const p of participations ?? []) {
    const chatRaw = (Array.isArray(p.chats) ? p.chats[0] : p.chats) as Record<string, unknown> | null
    const isGroup = chatRaw?.is_group === true

    // 마지막 메시지 (admin)
    const { data: lastMsgArr } = await admin
      .from('messages')
      .select('content, created_at')
      .eq('chat_id', p.chat_id)
      .order('created_at', { ascending: false })
      .limit(1)
    const lastMsg = lastMsgArr?.[0] ?? null

    if (isGroup) {
      // 멤버 수 조회 (admin)
      const { count } = await admin
        .from('chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', p.chat_id)

      groupChats.push({
        chatId: p.chat_id,
        name: (chatRaw?.name as string) || 'Trip Group Chat',
        memberCount: count ?? 0,
        lastMessage: lastMsg?.content ?? null,
        lastAt: lastMsg?.created_at ?? null,
        postId: (chatRaw?.reference_id as string) ?? null,
      })
    } else {
      // 상대방 찾기 (admin)
      const { data: others } = await admin
        .from('chat_participants')
        .select('user_id, profiles(id, full_name, avatar_url)')
        .eq('chat_id', p.chat_id)
        .neq('user_id', user.id)
        .limit(1)

      const rawProfile = others?.[0]?.profiles
      const otherProfile = rawProfile && !Array.isArray(rawProfile)
        ? rawProfile as { id: string; full_name: string | null; avatar_url: string | null }
        : Array.isArray(rawProfile) && rawProfile.length > 0
          ? rawProfile[0] as { id: string; full_name: string | null; avatar_url: string | null }
          : null

      directChats.push({
        chatId: p.chat_id,
        other: otherProfile,
        lastMessage: lastMsg?.content ?? null,
        lastAt: lastMsg?.created_at ?? null,
      })
    }
  }

  // 같은 상대방과의 중복 채팅방 제거: 최근 대화 기준으로 1명당 1개만 표시
  const seenOthers = new Set<string>()
  const dedupedDirectChats = directChats
    .sort((a, b) => {
      if (!a.lastAt) return 1
      if (!b.lastAt) return -1
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    })
    .filter(chat => {
      const otherId = chat.other?.id
      if (!otherId) return true
      if (seenOthers.has(otherId)) return false
      seenOthers.add(otherId)
      return true
    })

  // 그룹 채팅방 최신 메시지 순 정렬
  groupChats.sort((a, b) => {
    if (!a.lastAt) return 1
    if (!b.lastAt) return -1
    return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          {t('title')}
        </h1>
        <MessagesList
          locale={locale}
          groupChats={groupChats}
          directChats={dedupedDirectChats}
        />
      </main>
    </div>
  )
}
