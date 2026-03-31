'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, X, Trash2, ExternalLink } from 'lucide-react'

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
  locale: string
  unreadCount: number
  onCountChange?: (count: number) => void
}

const TYPE_COLORS: Record<string, string> = {
  application: 'bg-brand-muted text-brand',
  accepted: 'bg-success-light text-success',
  rejected: 'bg-surface-sunken text-subtle',
  review: 'bg-warning-light text-warning',
  message: 'bg-indigo-100 text-indigo-600',
  question: 'bg-warning-light text-warning',
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
  guide_request_match: 'Guide Req.',
  guide_application: 'Guide App.',
}

function getTypeLabel(n: Pick<Notification, 'type' | 'reference_type'>) {
  if (n.type === 'message' && n.reference_type === 'group_chat') return 'Group'
  return TYPE_LABELS[n.type] || 'Notice'
}
function getTypeColor(n: Pick<Notification, 'type' | 'reference_type'>) {
  if (n.type === 'message' && n.reference_type === 'group_chat') return 'bg-brand-muted text-brand-hover'
  return TYPE_COLORS[n.type] || 'bg-surface-sunken text-subtle'
}
function getHref(n: Pick<Notification, 'type' | 'reference_type' | 'reference_id'>, locale: string) {
  if (n.type === 'message' && n.reference_type === 'group_chat' && n.reference_id)
    return `/${locale}/messages/group/${n.reference_id}`
  if (n.type === 'message' && n.reference_type === 'user' && n.reference_id)
    return `/${locale}/messages/${n.reference_id}`
  if (n.type === 'review' && n.reference_type === 'user' && n.reference_id)
    return `/${locale}/users/${n.reference_id}`
  if (n.reference_type === 'companion_post' && n.reference_id)
    return `/${locale}/companions/${n.reference_id}`
  if (n.reference_type === 'guide_request' && n.reference_id)
    return `/${locale}/guides/requests/${n.reference_id}`
  if (n.type === 'application' || n.type === 'accepted' || n.type === 'rejected')
    return `/${locale}/dashboard`
  if (n.type === 'guide_application' || n.type === 'guide_match' || n.type === 'guide_request_match')
    return `/${locale}/guides/requests`
  return `/${locale}/notifications`
}

export default function NotificationsPanel({ locale, unreadCount: initialCount, onCountChange }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [badge, setBadge] = useState(initialCount)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setBadge(initialCount) }, [initialCount])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setItems(data.notifications ?? [])
        setBadge(0)
        onCountChange?.(0)
      }
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  const handleOpen = () => {
    setOpen(true)
    fetchNotifications()
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

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

  const triggerBtn = (
    <button
      onClick={handleOpen}
      className="relative w-9 h-9 flex items-center justify-center rounded-full text-subtle hover:bg-surface-hover hover:text-brand transition-colors"
      aria-label="Notifications"
    >
      <Bell style={{ width: 18, height: 18 }} />
      {badge > 0 && (
        <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )

  const panel = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] md:hidden lg:block">
      {/* 배경 딤처리 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* 슬라이드 패널 */}
      <div className="absolute right-0 top-0 h-[100dvh] w-[min(100vw,24rem)] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand" />
            <h2 className="font-bold text-heading text-base">알림</h2>
            {items.length > 0 && (
              <span className="text-xs bg-surface-sunken text-subtle px-2 py-0.5 rounded-full">{items.length}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={clearAll}
                disabled={clearing}
                className="flex items-center gap-1 text-xs text-danger hover:text-red-700 px-2 py-1 rounded-lg hover:bg-danger-light transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                전체삭제
              </button>
            )}
            <Link
              href={`/${locale}/notifications`}
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-subtle transition-colors"
              title="전체 보기"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-subtle transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-hint">불러오는 중...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Bell className="w-10 h-10 text-hint" />
              <p className="text-sm text-hint">새로운 알림이 없습니다</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {items.map(n => (
                <div key={n.id} className="relative group">
                  <Link
                    href={getHref(n, locale)}
                    onClick={() => setOpen(false)}
                  >
                    <div className={`bg-surface rounded-xl p-3.5 shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all pr-9 ${n.is_read ? 'border-edge' : 'border-brand'}`}>
                      <div className="flex items-start gap-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${getTypeColor(n)}`}>
                          {getTypeLabel(n)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm leading-tight ${n.is_read ? 'text-subtle' : 'text-heading'}`}>{n.title}</p>
                          {n.message && <p className="text-xs text-body mt-0.5 line-clamp-2">{n.message}</p>}
                          <p suppressHydrationWarning className="text-[10px] text-hint mt-1">
                            {new Date(n.created_at).toLocaleDateString(locale)}{' '}
                            {new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => deleteOne(n.id, e)}
                    disabled={deletingId === n.id}
                    className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full text-hint hover:text-danger hover:bg-danger-light opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      {triggerBtn}
      {panel}
    </>
  )
}
