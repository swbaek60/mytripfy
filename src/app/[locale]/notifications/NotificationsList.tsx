'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, X } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  reference_type: string | null
  reference_id: string | null
  is_read: boolean
  created_at: string
}

interface Props {
  notifications: Notification[]
  locale: string
}

const TYPE_COLORS: Record<string, string> = {
  application: 'bg-blue-100 text-blue-600',
  accepted: 'bg-green-100 text-green-600',
  rejected: 'bg-gray-100 text-gray-500',
  review: 'bg-yellow-100 text-yellow-600',
  message: 'bg-indigo-100 text-indigo-600',
  question: 'bg-orange-100 text-orange-600',
  answer: 'bg-teal-100 text-teal-600',
  guide_match: 'bg-amber-100 text-amber-600',
  guide_request_match: 'bg-amber-100 text-amber-600',
  guide_application: 'bg-amber-100 text-amber-600',
}
const TYPE_LABELS: Record<string, string> = {
  application: 'Applied',
  accepted: 'Accepted',
  rejected: 'Rejected',
  review: 'Review',
  message: 'Message',
  question: 'Question',
  answer: 'Answered',
  guide_match: 'Guide',
  guide_request_match: 'Guide Request',
  guide_application: 'Guide Application',
}

function getTypeLabel(n: Pick<Notification, 'type' | 'reference_type'>) {
  if (n.type === 'message' && n.reference_type === 'group_chat') return 'Group Chat'
  return TYPE_LABELS[n.type] || 'Notice'
}
function getTypeColor(n: Pick<Notification, 'type' | 'reference_type'>) {
  if (n.type === 'message' && n.reference_type === 'group_chat') return 'bg-blue-100 text-blue-700'
  return TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-500'
}
function getHref(n: Pick<Notification, 'type' | 'reference_type' | 'reference_id'>, locale: string) {
  // 메시지: 그룹 채팅 / 1:1
  if (n.type === 'message' && n.reference_type === 'group_chat' && n.reference_id)
    return `/${locale}/messages/group/${n.reference_id}`
  if (n.type === 'message' && n.reference_type === 'user' && n.reference_id)
    return `/${locale}/messages/${n.reference_id}`
  // 리뷰 → 유저 프로필
  if (n.type === 'review' && n.reference_type === 'user' && n.reference_id)
    return `/${locale}/users/${n.reference_id}`
  // reference_type 기준 상세 페이지
  if (n.reference_type === 'companion_post' && n.reference_id)
    return `/${locale}/companions/${n.reference_id}`
  if (n.reference_type === 'guide_request' && n.reference_id)
    return `/${locale}/guides/requests/${n.reference_id}`
  // reference 없을 때 타입별 기본 링크
  if (n.type === 'application' || n.type === 'accepted' || n.type === 'rejected')
    return `/${locale}/dashboard`
  if (n.type === 'guide_application' || n.type === 'guide_match' || n.type === 'guide_request_match')
    return `/${locale}/guides/requests`
  if (n.type === 'question' || n.type === 'answer' || n.type === 'companion')
    return `/${locale}/companions`
  return `/${locale}/notifications`
}

export default function NotificationsList({ notifications: initial, locale }: Props) {
  const [items, setItems] = useState(initial)
  const [clearing, setClearing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingId(id)
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(n => n.id !== id))
    setDeletingId(null)
    router.refresh()
  }

  const clearAll = async () => {
    if (!confirm('모든 알림을 삭제하시겠습니까?')) return
    setClearing(true)
    await fetch('/api/notifications?all=true', { method: 'DELETE' })
    setItems([])
    setClearing(false)
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
        <p className="text-gray-400 font-medium">No notifications yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* 전체 삭제 버튼 */}
      <div className="flex justify-end mb-3">
        <button
          onClick={clearAll}
          disabled={clearing}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {clearing ? '삭제 중...' : 'Clear All'}
        </button>
      </div>

      <div className="space-y-3">
        {items.map(n => (
          <div key={n.id} className="relative group">
            <Link href={getHref(n, locale)}>
              <div className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow pr-10 ${n.is_read ? 'border-gray-200' : 'border-blue-500'}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${getTypeColor(n)}`}>
                    {getTypeLabel(n)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${n.is_read ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
                    {n.message && <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>}
                    <p suppressHydrationWarning className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString('en-US')}{' '}
                      {new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            {/* 개별 삭제 버튼 (hover 시 표시) */}
            <button
              onClick={(e) => deleteOne(n.id, e)}
              disabled={deletingId === n.id}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
              title="Delete"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
