'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { getLevelInfo } from '@/data/countries'
import { PenLine } from 'lucide-react'

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

interface OtherProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  travel_level: number | null
  is_guide: boolean | null
}

interface Props {
  chatId: string
  currentUserId: string
  otherProfile: OtherProfile
  initialMessages: Message[]
  locale: string
  trip?: {
    id: string
    title: string
    destination_country: string | null
    start_date: string | null
  } | null
}

export default function ChatRoom({ chatId, currentUserId, otherProfile, initialMessages, locale, trip }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const levelInfo = getLevelInfo(otherProfile.travel_level || 1)

  // 입장 시 읽음 처리 → 배지 숫자 감소 (last_read_at + 메시지 알림 읽음)
  useEffect(() => {
    const now = new Date().toISOString()
    supabase
      .from('chat_participants')
      .update({ last_read_at: now })
      .eq('chat_id', chatId)
      .eq('user_id', currentUserId)
      .then(() => {})
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUserId)
      .eq('type', 'message')
      .eq('reference_type', 'user')
      .eq('reference_id', otherProfile.id)
      .then(() => {})
  }, [chatId, currentUserId, otherProfile.id])

  // 실시간 메시지 구독 (Realtime 미동작 시 폴링으로 보완)
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, async (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.sender_id !== currentUserId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()
          setMessages(prev => [...prev, { ...newMsg, profiles: profileData }])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId, currentUserId])

  // Realtime 미수신 시 보완: 탭 포커스·주기 재조회로 상대방 메시지 즉시 반영
  useEffect(() => {
    const refetch = async () => {
      try {
        const res = await fetch(`/api/group-chat/messages?chatId=${encodeURIComponent(chatId)}`)
        if (!res.ok) return
        const { messages: raw } = await res.json()
        if (!Array.isArray(raw)) return
        const next: Message[] = raw.map((m: { id: string; sender_id: string; content: string; created_at: string }) => ({
          id: m.id,
          chat_id: chatId,
          sender_id: m.sender_id,
          content: m.content,
          created_at: m.created_at,
          profiles: m.sender_id === otherProfile.id ? { full_name: otherProfile.full_name, avatar_url: otherProfile.avatar_url } : null,
        }))
        setMessages(next)
      } catch {}
    }
    const onFocus = () => refetch()
    window.addEventListener('focus', onFocus)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') refetch()
    }, 4000)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [chatId, otherProfile.id, otherProfile.full_name, otherProfile.avatar_url])

  // 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      profiles: null,
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/group-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, content }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('메시지 전송 실패:', body)
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        setNewMessage(content)
        alert(`메시지 전송 실패: ${body?.error || '알 수 없는 오류'}`)
      } else if (body.message) {
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...body.message, profiles: null } as Message : m))
      }
    } catch (e) {
      console.error('메시지 전송 오류:', e)
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setNewMessage(content)
      alert('네트워크 오류가 발생했습니다.')
    }
    setSending(false)
  }

  // 무료 번역 (MyMemory API)
  const translateMessage = async (msgId: string, text: string) => {
    if (translations[msgId]) {
      // 이미 번역된 경우 토글
      setTranslations(prev => { const n = { ...prev }; delete n[msgId]; return n })
      return
    }
    setTranslating(true)
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|en`)
      const data = await res.json()
      if (data.responseStatus === 200) {
        setTranslations(prev => ({ ...prev, [msgId]: data.responseData.translatedText }))
      }
    } catch {}
    setTranslating(false)
  }

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">

      {/* Chat Header */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex items-center gap-3">
        <Link href={`/${locale}/users/${otherProfile.id}`}>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl cursor-pointer hover:opacity-80 shrink-0">
            {otherProfile.avatar_url ? (
              <img src={otherProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : '👤'}
          </div>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{otherProfile.full_name || 'Anonymous'}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
              {levelInfo.badge} Lv.{otherProfile.travel_level || 1}
            </span>
            {otherProfile.is_guide && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">🧭 Guide</span>
            )}
          </div>
          <p className="text-xs text-green-500 font-medium">● Online</p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          {trip && (
            <Link href={`/${locale}/companions/${trip.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                🗺️ Trip Room
              </Button>
            </Link>
          )}
          <Link href={`/${locale}/reviews/write?userId=${otherProfile.id}`}>
            <Button variant="outline" size="sm" className="rounded-full text-xs border-purple-300 text-purple-600 hover:bg-purple-50 flex items-center gap-1">
              <PenLine className="w-3 h-3" />
              Write Review
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm p-4 mb-4 overflow-y-auto" style={{ minHeight: '400px', maxHeight: '60vh' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Start the conversation!</p>
            <p className="text-xs mt-1">Messages are end-to-end encrypted</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0 mt-auto">
                      {otherProfile.avatar_url ? (
                        <img src={otherProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : '👤'}
                    </div>
                  )}
                  <div className={`max-w-xs sm:max-w-md`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                    {/* Translation */}
                    {translations[msg.id] && (
                      <div className="mt-1 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-gray-600">
                        🌐 {translations[msg.id]}
                      </div>
                    )}
                    <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isMe && (
                        <button
                          onClick={() => translateMessage(msg.id, msg.content)}
                          className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                          title="Translate"
                        >
                          🌐
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl shadow-sm p-3 flex gap-2 items-center">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="Type a message... (Enter to send)"
          className="flex-1 border-0 bg-gray-50 rounded-xl focus:ring-0"
        />
        <Button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4 shrink-0"
        >
          {sending ? '...' : '➤'}
        </Button>
      </div>
    </div>
  )
}
