import { NextResponse } from 'next/server'
import { createAdminClient, getAuthUser } from '@/utils/supabase/server'

// GET /api/messages/list → 채팅방 목록 (패널용)
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = authUser.profileId
    const admin = createAdminClient()

    const { data: participations } = await admin
      .from('chat_participants')
      .select('chat_id, chats(id, type, is_group, name, reference_id, created_by)')
      .eq('user_id', userId)

    const groupChats: {
      chatId: string
      name: string
      memberCount: number
      lastMessage: string | null
      lastAt: string | null
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

      const { data: lastMsgArr } = await admin
        .from('messages')
        .select('content, created_at')
        .eq('chat_id', p.chat_id)
        .order('created_at', { ascending: false })
        .limit(1)
      const lastMsg = lastMsgArr?.[0] ?? null

      if (isGroup) {
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
        })
      } else {
        const { data: others } = await admin
          .from('chat_participants')
          .select('user_id, profiles(id, full_name, avatar_url)')
          .eq('chat_id', p.chat_id)
          .neq('user_id', userId)
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

    // 중복 제거 (같은 상대방)
    const seenOthers = new Set<string>()
    const dedupedDirect = directChats
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

    groupChats.sort((a, b) => {
      if (!a.lastAt) return 1
      if (!b.lastAt) return -1
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    })

    return NextResponse.json({ groupChats, directChats: dedupedDirect })
  } catch (e) {
    console.error('messages/list GET error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
