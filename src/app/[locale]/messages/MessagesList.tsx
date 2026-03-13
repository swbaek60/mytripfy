'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, MessageSquare, Trash2 } from 'lucide-react'

interface GroupChat {
  chatId: string
  name: string
  memberCount: number
  lastMessage: string | null
  lastAt: string | null
  postId: string | null
}

interface DirectChat {
  chatId: string
  other: { id: string; full_name: string | null; avatar_url: string | null } | null
  lastMessage: string | null
  lastAt: string | null
}

interface Props {
  locale: string
  groupChats: GroupChat[]
  directChats: DirectChat[]
}

export default function MessagesList({ locale, groupChats: initialGroups, directChats: initialDirect }: Props) {
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  const [directs, setDirects] = useState(initialDirect)
  const [leavingId, setLeavingId] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)

  const leaveChat = async (chatId: string, label: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`"${label}" 대화를 삭제하시겠습니까?\n(목록에서 제거됩니다)`)) return
    setLeavingId(chatId)
    const res = await fetch(`/api/messages/leave?chatId=${chatId}`, { method: 'DELETE' })
    if (res.ok) {
      setGroups(prev => prev.filter(c => c.chatId !== chatId))
      setDirects(prev => prev.filter(c => c.chatId !== chatId))
      router.refresh()
    } else {
      alert('오류가 발생했습니다. 다시 시도해 주세요.')
    }
    setLeavingId(null)
  }

  const clearAll = async () => {
    if (!confirm('모든 대화를 삭제하시겠습니까?')) return
    setClearingAll(true)
    const allIds = [...groups.map(c => c.chatId), ...directs.map(c => c.chatId)]
    await Promise.all(allIds.map(id => fetch(`/api/messages/leave?chatId=${id}`, { method: 'DELETE' })))
    setGroups([])
    setDirects([])
    setClearingAll(false)
    router.refresh()
  }

  const hasAny = groups.length > 0 || directs.length > 0

  if (!hasAny) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
        <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No conversations yet.</p>
        <p className="text-gray-400 text-sm mt-1">Find a companion or guide and start chatting!</p>
        <div className="flex gap-3 justify-center mt-6">
          <Link href={`/${locale}/companions`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors">
              Find Companions
            </button>
          </Link>
          <Link href={`/${locale}/guides`}>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors">
              Find Guides
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Clear All 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={clearAll}
          disabled={clearingAll}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {clearingAll ? '삭제 중...' : 'Clear All'}
        </button>
      </div>

      {/* 그룹 채팅방 */}
      {groups.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Trip Group Chats
          </p>
          <div className="space-y-2">
            {groups.map(chat => (
              <div key={chat.chatId} className="relative group">
                <Link href={`/${locale}/messages/group/${chat.chatId}`}>
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 border border-transparent hover:border-blue-100 pr-12">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{chat.name}</p>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
                          {chat.memberCount} members
                        </span>
                      </div>
                      {chat.lastMessage ? (
                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No messages yet</p>
                      )}
                    </div>
                    {chat.lastAt && (
                      <span suppressHydrationWarning className="text-xs text-gray-400 shrink-0">
                        {new Date(chat.lastAt).toLocaleDateString('en-US')}
                      </span>
                    )}
                  </div>
                </Link>
                {/* 나가기 버튼 */}
                <button
                  onClick={(e) => leaveChat(chat.chatId, chat.name, e)}
                  disabled={leavingId === chat.chatId}
                  className="absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1:1 채팅방 */}
      {directs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Direct Messages
          </p>
          <div className="space-y-2">
            {directs.map(chat => (
              <div key={chat.chatId} className="relative group">
                <Link href={`/${locale}/messages/${chat.other?.id ?? chat.chatId}`}>
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 border border-transparent hover:border-blue-100 pr-12">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {chat.other?.avatar_url ? (
                        <img src={chat.other.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : <span className="text-gray-400 text-xl">👤</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{chat.other?.full_name || 'Anonymous'}</p>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                      )}
                    </div>
                    {chat.lastAt && (
                      <span suppressHydrationWarning className="text-xs text-gray-400 shrink-0">
                        {new Date(chat.lastAt).toLocaleDateString('en-US')}
                      </span>
                    )}
                  </div>
                </Link>
                {/* 나가기 버튼 */}
                <button
                  onClick={(e) => leaveChat(chat.chatId, chat.other?.full_name || 'DM', e)}
                  disabled={leavingId === chat.chatId}
                  className="absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
