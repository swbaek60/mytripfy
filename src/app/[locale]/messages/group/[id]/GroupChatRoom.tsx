'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Users, Crown, LogOut, X } from 'lucide-react'
import Link from 'next/link'
import { getLevelInfo } from '@/data/countries'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

interface Member {
  user_id: string
  joined_at: string
  profiles: {
    full_name?: string | null
    avatar_url?: string | null
    travel_level?: number | null
  } | null
}

/** API로 받은 프로필 (UUID 소문자 키 → 이 데이터만 표시에 사용) */
interface ProfileByUserId {
  id: string
  full_name: string | null
  avatar_url: string | null
  travel_level: number | null
}

interface Props {
  chatId: string
  chatName: string
  postId: string | null
  currentUserId: string
  hostId: string
  initialMessages: Message[]
  initialMembers: Member[]
  locale: string
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function GroupChatRoom({
  chatId, chatName, postId, currentUserId, hostId,
  initialMessages, initialMembers, locale,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [members, setMembers]   = useState<Member[]>(initialMembers)
  /** 프로필: 클라이언트에서 Supabase로 직접 조회 (RLS profiles_select=true, 직렬화/API 우회) */
  const [profilesByUserId, setProfilesByUserId] = useState<Record<string, ProfileByUserId>>({})
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase  = createClient()
  const isHost    = currentUserId === hostId

  // 입장 시 읽음 처리 → 배지 숫자 감소 (last_read_at + 메시지 알림 읽음)
  // 완료 후 router.refresh()로 헤더 배지가 즉시 갱신되도록 함
  useEffect(() => {
    const now = new Date().toISOString()
    Promise.all([
      supabase
        .from('chat_participants')
        .update({ last_read_at: now })
        .eq('chat_id', chatId)
        .eq('user_id', currentUserId),
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUserId)
        .eq('type', 'message')
        .eq('reference_type', 'group_chat')
        .eq('reference_id', chatId),
    ]).then(() => router.refresh())
  }, [chatId, currentUserId, router])

  // 프로필은 클라이언트에서 Supabase로 직접 조회 (.in()은 UUID 시 400 나와서 .or(eq,eq,...) 사용)
  useEffect(() => {
    const userIds = new Set<string>()
    members.forEach(m => { const id = m?.user_id; if (id != null && String(id).trim()) userIds.add(String(id).trim()) })
    messages.forEach(m => { const id = m?.sender_id; if (id != null && String(id).trim()) userIds.add(String(id).trim()) })
    const ids = [...userIds]
    if (ids.length === 0) return
    let cancelled = false
    const orFilter = ids.map(id => `id.eq.${id}`).join(',')
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, travel_level')
      .or(orFilter)
      .then(({ data: rows, error }) => {
        if (cancelled || error) return
        const map: Record<string, ProfileByUserId> = {}
        for (const row of rows ?? []) {
          const id = row?.id
          if (id == null) continue
          const key = String(id).toLowerCase()
          map[key] = {
            id: String(id),
            full_name: row.full_name ?? null,
            avatar_url: row.avatar_url ?? null,
            travel_level: row.travel_level ?? null,
          }
        }
        setProfilesByUserId(map)
      })
    return () => { cancelled = true }
  }, [members, messages])

  // 실시간 메시지 구독 (다른 사람 메시지 또는 본인 메시지 중복 수신 시 반영)
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, payload => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [chatId])

  // 탭 포커스·주기 재조회 (실시간이 등록자에게 안 올 때도 신청자 메시지 표시)
  useEffect(() => {
    const refetch = async () => {
      try {
        const res = await fetch(`/api/group-chat/messages?chatId=${encodeURIComponent(chatId)}`)
        if (!res.ok) return
        const { messages: next } = await res.json()
        if (Array.isArray(next)) setMessages(next)
      } catch {}
    }
    const onFocus = () => refetch()
    window.addEventListener('focus', onFocus)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') refetch()
    }, 5000)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [chatId])

  // 스크롤 하단 고정
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')

    try {
      const res = await fetch('/api/group-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, content: text }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('Send failed:', body)
        setInput(text) // 실패 시 입력값 복원
        alert(`메시지 전송 실패: ${body?.error || '알 수 없는 오류'}`)
      } else if (body.message) {
        // 전송 성공 시 즉시 화면에 표시 (실시간 수신 전/실패 시에도 보이도록)
        setMessages(prev => [...prev, body.message as Message])
      }
    } catch (e) {
      console.error('Send error:', e)
      setInput(text)
      alert('네트워크 오류가 발생했습니다.')
    }

    setSending(false)
  }

  const leaveGroup = async () => {
    if (!confirm('Leave this trip group? You will lose access to the group chat.')) return
    await supabase.from('chat_participants').delete()
      .eq('chat_id', chatId).eq('user_id', currentUserId)
    window.location.href = `/${locale}/messages`
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the group?')) return
    await supabase.from('chat_participants').delete()
      .eq('chat_id', chatId).eq('user_id', userId)
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  const getMember = (userId: string) =>
    members.find(m => String(m.user_id).toLowerCase() === String(userId).toLowerCase())
  const getProfile = (userId: string): ProfileByUserId | null =>
    profilesByUserId[String(userId ?? '').toLowerCase()] ?? null

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">

      {/* 헤더 카드 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex items-center gap-3">
        <Link href={`/${locale}/messages`} className="text-gray-400 hover:text-gray-600 text-lg font-medium">
          ←
        </Link>
        <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{chatName}</p>
          <p className="text-xs text-gray-400">{members.length} members</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {postId && (
            <Link href={`/${locale}/companions/${postId}`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hidden sm:flex">
                View Trip
              </Button>
            </Link>
          )}
          <Button
            variant="ghost" size="sm"
            onClick={() => setShowMembers(v => !v)}
            className={`rounded-full ${showMembers ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Members"
          >
            <Users className="w-4 h-4" />
          </Button>
          {!isHost && (
            <Button
              variant="ghost" size="sm"
              onClick={leaveGroup}
              className="rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
              title="Leave group"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 멤버 패널 (펼쳤을 때) */}
      {showMembers && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-sm text-gray-900">Members ({members.length})</p>
            <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map(member => {
              const p = getProfile(member.user_id)
              const isHostMember = member.user_id === hostId
              const isMe = member.user_id === currentUserId
              const lvl = getLevelInfo(p?.travel_level ?? 1)
              return (
                <div key={member.user_id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <Link href={`/${locale}/users/${member.user_id}`} className="shrink-0 relative">
                    <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-sm">
                      {p?.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : '👤'}
                    </div>
                    {isHostMember && (
                      <Crown className="w-3 h-3 text-yellow-500 absolute -top-0.5 -right-0.5" />
                    )}
                  </Link>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate max-w-[80px]">
                      {p?.full_name || 'Member'}
                      {isMe && <span className="text-gray-400 ml-1">(me)</span>}
                    </p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: lvl.color }}>
                      Lv.{lvl.level}
                    </span>
                  </div>
                  {isHost && !isHostMember && !isMe && (
                    <button
                      onClick={() => removeMember(member.user_id)}
                      className="text-gray-300 hover:text-red-400 ml-1"
                      title="Remove member"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm p-4 mb-4 overflow-y-auto space-y-3" style={{ minHeight: '400px', maxHeight: '60vh' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Start the group conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine     = msg.sender_id === currentUserId
            const profile    = getProfile(msg.sender_id)
            const levelInfo  = getLevelInfo(profile?.travel_level ?? 1)
            const msgIsHost  = msg.sender_id === hostId
            const prevMsg    = messages[i - 1]
            const sameAsPrev = prevMsg?.sender_id === msg.sender_id

            return (
              <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMine && (
                  <div className="shrink-0 mt-auto">
                    {!sameAsPrev ? (
                      <Link href={`/${locale}/users/${msg.sender_id}`}>
                        <div className="w-7 h-7 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-sm relative">
                          {profile?.avatar_url
                            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            : '👤'}
                          {msgIsHost && (
                            <Crown className="w-2.5 h-2.5 text-yellow-500 absolute -top-0.5 -right-0.5" />
                          )}
                        </div>
                      </Link>
                    ) : <div className="w-7" />}
                  </div>
                )}
                <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && !sameAsPrev && (
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {profile?.full_name || 'Member'}
                      </span>
                      {msgIsHost && <Crown className="w-3 h-3 text-yellow-500" />}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: levelInfo.color }}>
                        Lv.{levelInfo.level}
                      </span>
                    </div>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Message the group..."
          className="flex-1 rounded-full border-gray-200 bg-gray-50 text-sm"
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          size="sm"
          className="rounded-full w-9 h-9 p-0 bg-blue-600 hover:bg-blue-700 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
