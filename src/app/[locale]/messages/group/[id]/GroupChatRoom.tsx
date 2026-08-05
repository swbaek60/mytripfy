'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { api, errorMessage } from '@/lib/client/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Users, Crown, LogOut, X } from 'lucide-react'
import Link from 'next/link'
import { getLevelInfo } from '@/data/countries'
import Avatar from '@/components/ui/Avatar'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export interface Member {
  user_id: string
  joined_at: string
  profiles: {
    full_name?: string | null
    avatar_url?: string | null
    travel_level?: number | null
  } | null
}

interface ProfileByUserId {
  id: string
  full_name: string | null
  avatar_url: string | null
  travel_level: number | null
}

interface ParticipantReadAt {
  user_id: string
  last_read_at: string | null
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

function formatTime(ts: string, locale: string) {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * 그룹 메시지 읽음 표시: 멤버 중 나와 발신자를 제외하고 last_read_at >= created_at인 인원수 + 미니 아바타
 */
function GroupReadReceipt({
  messageCreatedAt,
  senderId,
  currentUserId,
  participantsReadAt,
  profilesByUserId,
  totalMembers,
  allReadLabel,
  readCountLabel,
}: {
  messageCreatedAt: string
  senderId: string
  currentUserId: string
  participantsReadAt: ParticipantReadAt[]
  profilesByUserId: Record<string, ProfileByUserId>
  totalMembers: number
  allReadLabel: string
  readCountLabel: string
}) {
  const readers = participantsReadAt.filter(
    p =>
      p.user_id !== senderId &&
      p.user_id !== currentUserId &&
      p.last_read_at !== null &&
      new Date(p.last_read_at) >= new Date(messageCreatedAt)
  )

  if (readers.length === 0) return null

  const displayReaders = readers.slice(0, 3)
  const extraCount = readers.length - displayReaders.length

  return (
    <div className="flex items-center gap-1 mt-0.5">
      {/* 읽은 사람 미니 아바타 */}
      <div className="flex -space-x-1">
        {displayReaders.map(r => {
          const p = profilesByUserId[r.user_id.toLowerCase()]
          return (
            <div key={r.user_id} title={p?.full_name || ''} className="rounded-full border border-white">
              <Avatar src={p?.avatar_url} name={p?.full_name} size={16} fallbackClassName="bg-brand-muted text-brand-strong" />
            </div>
          )
        })}
        {extraCount > 0 && (
          <div className="w-4 h-4 rounded-full border border-white bg-surface-sunken flex items-center justify-center">
            <span className="text-[7px] text-hint font-bold">+{extraCount}</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-hint">
        {readers.length === totalMembers - 1 ? allReadLabel : readCountLabel.replace('0', String(readers.length))}
      </span>
    </div>
  )
}

export default function GroupChatRoom({
  chatId, chatName, postId, currentUserId, hostId,
  initialMessages, initialMembers, locale,
}: Props) {
  const tc = useTranslations('Common')
  const tm = useTranslations('Messages')
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [members, setMembers]   = useState<Member[]>(initialMembers)
  // 초기 멤버 프로필은 서버에서 이미 내려왔으므로 그대로 시드로 쓴다.
  const [profilesByUserId, setProfilesByUserId] = useState<Record<string, ProfileByUserId>>(() => {
    const seed: Record<string, ProfileByUserId> = {}
    for (const member of initialMembers) {
      const id = String(member.user_id ?? '').trim()
      if (!id) continue
      seed[id.toLowerCase()] = {
        id,
        full_name: member.profiles?.full_name ?? null,
        avatar_url: member.profiles?.avatar_url ?? null,
        travel_level: member.profiles?.travel_level ?? null,
      }
    }
    return seed
  })
  const [participantsReadAt, setParticipantsReadAt] = useState<ParticipantReadAt[]>([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const isHost    = currentUserId === hostId

  /**
   * 메시지·읽음 상태·발신자 프로필을 서버에서 한 번에 받아온다.
   * 브라우저가 Supabase 를 직접 구독하지 않으므로 익명 DB 접근이 필요 없다.
   */
  const sync = useCallback(async () => {
    try {
      const { messages: rows, participants, senders } = await api.get<{
        messages: Message[]
        participants: ParticipantReadAt[]
        senders: ProfileByUserId[]
      }>(`/api/messages/sync?chatId=${encodeURIComponent(chatId)}`)

      setMessages(rows)
      setParticipantsReadAt(participants)
      setProfilesByUserId(prev => {
        const map = { ...prev }
        for (const sender of senders) {
          map[sender.id.toLowerCase()] = sender
        }
        return map
      })
    } catch {
      // 일시적인 실패는 다음 주기에 회복된다.
    }
  }, [chatId])

  // 입장 시 읽음 처리 → 헤더 배지 숫자 감소
  useEffect(() => {
    api.post('/api/messages/sync', { chatId }).then(() => router.refresh()).catch(() => {})
  }, [chatId, router])

  // 첫 화면은 서버에서 받은 initialMessages 를 쓰므로 마운트 직후 재조회하지 않는다.
  useEffect(() => {
    const onFocus = () => sync()
    window.addEventListener('focus', onFocus)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') sync()
    }, 5000)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [sync])

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
      const { message } = await api.post<{ message?: Message }>('/api/group-chat/send', { chatId, content: text })
      if (message) setMessages(prev => [...prev, message])
    } catch (err) {
      setInput(text)
      alert(`${tm('sendFailed')} ${errorMessage(err, tc('errorUnexpected'))}`)
    }

    setSending(false)
  }

  const leaveGroup = async () => {
    if (!confirm('Leave this trip group? You will lose access to the group chat.')) return
    try {
      await api.del(`/api/messages/leave?chatId=${encodeURIComponent(chatId)}`)
      window.location.href = `/${locale}/messages`
    } catch (err) {
      alert(errorMessage(err, tc('errorUnexpected')))
    }
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the group?')) return
    try {
      await api.del('/api/group-chat/members', { chatId, userId })
      setMembers(prev => prev.filter(m => m.user_id !== userId))
    } catch (err) {
      alert(errorMessage(err, tc('errorUnexpected')))
    }
  }

  const getProfile = (userId: string): ProfileByUserId | null =>
    profilesByUserId[String(userId ?? '').toLowerCase()] ?? null

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">

      {/* 헤더 카드 */}
      <div className="bg-surface rounded-2xl shadow-sm p-4 mb-4 flex items-center gap-3">
        <Link href={`/${locale}/messages`} className="text-hint hover:text-body text-lg font-medium">
          ←
        </Link>
        <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-white shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-heading truncate">{chatName}</p>
          <p className="text-xs text-hint">{members.length} members</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {postId && (
            <Link href={`/${locale}/companions/${postId}`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-edge-brand text-brand hover:bg-brand-light hidden sm:flex">
                {tm('viewTrip')}
              </Button>
            </Link>
          )}
          <Button
            variant="ghost" size="sm"
            onClick={() => setShowMembers(v => !v)}
            className={`rounded-full ${showMembers ? 'bg-brand-light text-brand-strong' : 'text-subtle hover:bg-surface-hover'}`}
            title={tc('members')}
            aria-label={tc('members')}
          >
            <Users className="w-4 h-4" />
          </Button>
          {!isHost && (
            <Button
              variant="ghost" size="sm"
              onClick={leaveGroup}
              className="rounded-full text-hint hover:text-danger hover:bg-danger-light"
              title={tm('leaveGroup')}
              aria-label={tm('leaveGroup')}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 멤버 패널 */}
      {showMembers && (
        <div className="bg-surface rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-sm text-heading">{tc('members')} ({members.length})</p>
            <button onClick={() => setShowMembers(false)} aria-label={tc('close')} className="text-hint hover:text-body">
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
                <div key={member.user_id} className="flex items-center gap-2 bg-surface-sunken rounded-xl px-3 py-2">
                  <Link href={`/${locale}/users/${member.user_id}`} className="shrink-0 relative">
                    <Avatar src={p?.avatar_url} name={p?.full_name} size={32} fallbackClassName="bg-brand-muted text-brand-strong" />
                    {isHostMember && (
                      <Crown className="w-3 h-3 text-gold absolute -top-0.5 -right-0.5" />
                    )}
                  </Link>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-heading truncate max-w-[80px]">
                      {p?.full_name || 'Member'}
                      {isMe && <span className="text-hint ml-1">(me)</span>}
                    </p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: lvl.color }}>
                      Lv.{lvl.level}
                    </span>
                  </div>
                  {isHost && !isHostMember && !isMe && (
                    <button
                      onClick={() => removeMember(member.user_id)}
                      className="text-hint hover:text-danger ml-1"
                      title={tm('removeMember')}
                      aria-label={tm('removeMember')}
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
      <div className="flex-1 bg-surface rounded-2xl shadow-sm p-4 mb-4 overflow-y-auto space-y-3" style={{ minHeight: '400px', maxHeight: '60vh' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-hint">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">{tm('startGroupConversation')}</p>
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
                        <div className="relative">
                          <Avatar src={profile?.avatar_url} name={profile?.full_name} size={28} fallbackClassName="bg-brand-muted text-brand-strong" />
                          {msgIsHost && (
                            <Crown className="w-2.5 h-2.5 text-gold absolute -top-0.5 -right-0.5" />
                          )}
                        </div>
                      </Link>
                    ) : <div className="w-7" />}
                  </div>
                )}
                <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && !sameAsPrev && (
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-xs font-semibold text-body">
                        {profile?.full_name || 'Member'}
                      </span>
                      {msgIsHost && <Crown className="w-3 h-3 text-gold" />}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: levelInfo.color }}>
                        Lv.{levelInfo.level}
                      </span>
                    </div>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? 'bg-brand text-white rounded-br-sm'
                      : 'bg-surface-sunken text-heading rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-hint px-1">{formatTime(msg.created_at, locale)}</span>
                  {/* 읽음 표시: 내가 보낸 메시지에만 표시 */}
                  {isMine && (
                    <GroupReadReceipt
                      messageCreatedAt={msg.created_at}
                      senderId={msg.sender_id}
                      currentUserId={currentUserId}
                      participantsReadAt={participantsReadAt}
                      profilesByUserId={profilesByUserId}
                      totalMembers={members.length}
                      allReadLabel={tm('allRead')}
                      readCountLabel={tm('readCount', { count: 0 })}
                    />
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="bg-surface rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder={tm('messageGroupPlaceholder')}
          aria-label={tm('messageGroupPlaceholder')}
          className="flex-1 rounded-full border-edge bg-surface-sunken text-sm"
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          size="sm"
          aria-label={tc('send')}
          className="rounded-full w-9 h-9 p-0 bg-brand hover:bg-brand-hover shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
