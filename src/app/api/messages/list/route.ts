import { NextResponse } from 'next/server'
import { createAdminClient, getAuthUser } from '@/utils/supabase/server'

type LastMsg = { content: string | null; created_at: string | null }

async function fetchLatestMessagesSequential(
  admin: ReturnType<typeof createAdminClient>,
  chatIds: string[]
): Promise<Map<string, LastMsg>> {
  const map = new Map<string, LastMsg>()
  await Promise.all(
    chatIds.map(async (chatId) => {
      const { data: lastMsgArr } = await admin
        .from('messages')
        .select('content, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(1)
      const lastMsg = lastMsgArr?.[0] ?? null
      if (lastMsg) map.set(chatId, { content: lastMsg.content, created_at: lastMsg.created_at })
    })
  )
  return map
}

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

    const rows = participations ?? []
    if (rows.length === 0) {
      return NextResponse.json({ groupChats: [], directChats: [] })
    }

    const chatIds = rows.map((p) => p.chat_id)
    let latestByChat = new Map<string, LastMsg>()

    const { data: rpcLatest, error: rpcErr } = await admin.rpc('latest_messages_for_chats', {
      p_chat_ids: chatIds,
    })
    if (!rpcErr && Array.isArray(rpcLatest)) {
      for (const row of rpcLatest as { chat_id: string; content: string; created_at: string }[]) {
        latestByChat.set(row.chat_id, { content: row.content, created_at: row.created_at })
      }
    } else {
      latestByChat = await fetchLatestMessagesSequential(admin, chatIds)
    }

    const groupChatIds: string[] = []
    const directChatIds: string[] = []
    const metaByChat = new Map<string, Record<string, unknown>>()

    for (const p of rows) {
      const chatRaw = (Array.isArray(p.chats) ? p.chats[0] : p.chats) as Record<string, unknown> | null
      metaByChat.set(p.chat_id, chatRaw ?? {})
      if (chatRaw?.is_group === true) groupChatIds.push(p.chat_id)
      else directChatIds.push(p.chat_id)
    }

    let memberCountByChat = new Map<string, number>()
    if (groupChatIds.length > 0) {
      const { data: counts, error: cntErr } = await admin.rpc('chat_participant_counts', {
        p_chat_ids: groupChatIds,
      })
      if (!cntErr && Array.isArray(counts)) {
        for (const row of counts as { chat_id: string; member_count: number }[]) {
          memberCountByChat.set(row.chat_id, Number(row.member_count))
        }
      } else {
        await Promise.all(
          groupChatIds.map(async (cid) => {
            const { count } = await admin
              .from('chat_participants')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', cid)
            memberCountByChat.set(cid, count ?? 0)
          })
        )
      }
    }

    let peerByChat = new Map<
      string,
      { id: string; full_name: string | null; avatar_url: string | null }
    >()
    if (directChatIds.length > 0) {
      const { data: peers, error: peerErr } = await admin.rpc('direct_chat_peers', {
        p_user_id: userId,
        p_chat_ids: directChatIds,
      })
      if (!peerErr && Array.isArray(peers)) {
        for (const row of peers as {
          chat_id: string
          peer_id: string
          peer_full_name: string | null
          peer_avatar_url: string | null
        }[]) {
          peerByChat.set(row.chat_id, {
            id: row.peer_id,
            full_name: row.peer_full_name,
            avatar_url: row.peer_avatar_url,
          })
        }
      } else {
        await Promise.all(
          directChatIds.map(async (cid) => {
            const { data: others } = await admin
              .from('chat_participants')
              .select('user_id, profiles(id, full_name, avatar_url)')
              .eq('chat_id', cid)
              .neq('user_id', userId)
              .limit(1)
            const rawProfile = others?.[0]?.profiles
            const otherProfile =
              rawProfile && !Array.isArray(rawProfile)
                ? (rawProfile as { id: string; full_name: string | null; avatar_url: string | null })
                : Array.isArray(rawProfile) && rawProfile.length > 0
                  ? (rawProfile[0] as { id: string; full_name: string | null; avatar_url: string | null })
                  : null
            if (otherProfile) peerByChat.set(cid, otherProfile)
          })
        )
      }
    }

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

    for (const p of rows) {
      const chatRaw = metaByChat.get(p.chat_id) ?? {}
      const isGroup = chatRaw?.is_group === true
      const last = latestByChat.get(p.chat_id)

      if (isGroup) {
        groupChats.push({
          chatId: p.chat_id,
          name: (chatRaw?.name as string) || 'Trip Group Chat',
          memberCount: memberCountByChat.get(p.chat_id) ?? 0,
          lastMessage: last?.content ?? null,
          lastAt: last?.created_at ?? null,
        })
      } else {
        directChats.push({
          chatId: p.chat_id,
          other: peerByChat.get(p.chat_id) ?? null,
          lastMessage: last?.content ?? null,
          lastAt: last?.created_at ?? null,
        })
      }
    }

    const seenOthers = new Set<string>()
    const dedupedDirect = directChats
      .sort((a, b) => {
        if (!a.lastAt) return 1
        if (!b.lastAt) return -1
        return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
      })
      .filter((chat) => {
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
