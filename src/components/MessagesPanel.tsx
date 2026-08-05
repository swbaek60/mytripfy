'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MessageSquare, Users, X, Trash2, ExternalLink } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'

interface GroupChat {
  chatId: string
  name: string
  memberCount: number
  lastMessage: string | null
  lastAt: string | null
}

interface DirectChat {
  chatId: string
  other: { id: string; full_name: string | null; avatar_url: string | null } | null
  lastMessage: string | null
  lastAt: string | null
}

interface Props {
  locale: string
  unreadCount: number
  onCountChange?: (count: number) => void
}

function timeAgo(dateStr: string, t: (key: string, values?: { count: number }) => string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('timeJustNow')
  if (mins < 60) return t('timeMinutes', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('timeHours', { count: hrs })
  const days = Math.floor(hrs / 24)
  return t('timeDays', { count: days })
}

export default function MessagesPanel({ locale, unreadCount: initialCount, onCountChange }: Props) {
  const t = useTranslations('Messages')
  const tn = useTranslations('Notifications')
  const tc = useTranslations('Common')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [groupChats, setGroupChats] = useState<GroupChat[]>([])
  const [directChats, setDirectChats] = useState<DirectChat[]>([])
  const [loading, setLoading] = useState(false)
  const [leavingId, setLeavingId] = useState<string | null>(null)
  const [badge, setBadge] = useState(initialCount)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setBadge(initialCount) }, [initialCount])

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/messages/list')
      if (res.ok) {
        const data = await res.json()
        setGroupChats(data.groupChats ?? [])
        setDirectChats(data.directChats ?? [])
        setBadge(0)
        onCountChange?.(0)
      }
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  const handleOpen = () => {
    setOpen(true)
    fetchMessages()
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

  const leaveChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(t('leaveConfirm'))) return
    setLeavingId(chatId)
    try {
      const res = await fetch(`/api/messages/leave?chatId=${chatId}`, { method: 'DELETE' })
      if (res.ok) {
        setGroupChats(prev => prev.filter(c => c.chatId !== chatId))
        setDirectChats(prev => prev.filter(c => c.chatId !== chatId))
        router.refresh()
      }
    } finally {
      setLeavingId(null)
    }
  }

  const hasAny = groupChats.length > 0 || directChats.length > 0

  const triggerBtn = (
    <button
      onClick={handleOpen}
      className="relative w-9 h-9 flex items-center justify-center rounded-full text-subtle hover:bg-surface-hover hover:text-brand transition-colors"
      aria-label={t('title')}
    >
      <MessageSquare style={{ width: 18, height: 18 }} />
      {badge > 0 && (
        <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )

  const panel = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* ?? ?????*/}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* ?????? ??? */}
      <div className="absolute right-0 top-0 h-[100dvh] w-[min(100vw,24rem)] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* ??? */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand" />
            <h2 className="font-bold text-heading text-base">{t('title')}</h2>
            {hasAny && (
              <span className="text-xs bg-surface-sunken text-subtle px-2 py-0.5 rounded-full">
                {groupChats.length + directChats.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/${locale}/messages`}
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-subtle transition-colors"
              title={t('viewAll')}
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label={tc('close')}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-subtle transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ??? */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-hint">{t('loading')}</p>
            </div>
          ) : !hasAny ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 px-6">
              <MessageSquare className="w-10 h-10 text-hint" />
              <p className="text-sm text-hint text-center">{t('empty')}</p>
              <div className="flex gap-2 mt-1">
                <Link href={`/${locale}/companions`} onClick={() => setOpen(false)}>
                  <span className="text-xs bg-brand text-white px-3 py-1.5 rounded-full hover:bg-brand-hover transition-colors">{t('findCompanions')}</span>
                </Link>
                <Link href={`/${locale}/guides`} onClick={() => setOpen(false)}>
                  <span className="text-xs bg-warning-strong text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">{t('findGuides')}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-4">
              {/* ?? ?? */}
              {groupChats.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-subtle uppercase tracking-wider px-1 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {t('groupChats')}
                  </p>
                  <div className="space-y-1.5">
                    {groupChats.map(chat => (
                      <div key={chat.chatId} className="relative group">
                        <Link
                          href={`/${locale}/messages/group/${chat.chatId}`}
                          onClick={() => setOpen(false)}
                        >
                          <div className="bg-surface rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-3 border border-transparent hover:border-edge-brand pr-9">
                            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-sm text-heading truncate">{chat.name}</p>
                                <span className="text-[10px] bg-brand-muted text-brand-strong px-1.5 py-0.5 rounded-full shrink-0">
                                  {chat.memberCount}
                                </span>
                              </div>
                              {chat.lastMessage ? (
                                <p className="text-xs text-subtle truncate">{chat.lastMessage}</p>
                              ) : (
                                <p className="text-xs text-hint italic">{t('noMessages')}</p>
                              )}
                            </div>
                            {chat.lastAt && (
                              <span suppressHydrationWarning className="text-[10px] text-hint shrink-0">
                                {timeAgo(chat.lastAt, tn)}
                              </span>
                            )}
                          </div>
                        </Link>
                        <button
                          onClick={(e) => leaveChat(chat.chatId, e)}
                          disabled={leavingId === chat.chatId}
                          aria-label={t('leaveChat')}
                          className="absolute top-1/2 -translate-y-1/2 right-2 w-7 h-7 flex items-center justify-center rounded-full text-hint hover:text-danger hover:bg-danger-light opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1:1 ?? */}
              {directChats.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-subtle uppercase tracking-wider px-1 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {t('directMessages')}
                  </p>
                  <div className="space-y-1.5">
                    {directChats.map(chat => (
                      <div key={chat.chatId} className="relative group">
                        <Link
                          href={`/${locale}/messages/${chat.other?.id ?? chat.chatId}`}
                          onClick={() => setOpen(false)}
                        >
                          <div className="bg-surface rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-3 border border-transparent hover:border-edge-brand pr-9">
                            <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 overflow-hidden">
                              {chat.other?.avatar_url ? (
                                <Avatar src={chat.other.avatar_url} fill size={40} />
                              ) : <span className="text-hint text-lg">???</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-heading">{chat.other?.full_name || t('unknownUser')}</p>
                              {chat.lastMessage && (
                                <p className="text-xs text-subtle truncate">{chat.lastMessage}</p>
                              )}
                            </div>
                            {chat.lastAt && (
                              <span suppressHydrationWarning className="text-[10px] text-hint shrink-0">
                                {timeAgo(chat.lastAt, tn)}
                              </span>
                            )}
                          </div>
                        </Link>
                        <button
                          onClick={(e) => leaveChat(chat.chatId, e)}
                          disabled={leavingId === chat.chatId}
                          aria-label={t('leaveChat')}
                          className="absolute top-1/2 -translate-y-1/2 right-2 w-7 h-7 flex items-center justify-center rounded-full text-hint hover:text-danger hover:bg-danger-light opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
