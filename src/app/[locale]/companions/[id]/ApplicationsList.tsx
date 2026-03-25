'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { getLevelInfo } from '@/data/countries'
import Link from 'next/link'
import { MessageSquare, Users } from 'lucide-react'

interface Application {
  id: string
  applicant_id: string
  message: string | null
  status: string
  created_at: string
  profiles: Record<string, unknown>
}

export default function ApplicationsList({
  applications,
  postId,
  postTitle,
  groupChatId,
  locale,
}: {
  applications: Application[]
  postId: string
  postTitle: string
  groupChatId: string | null
  locale: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (appId: string, applicantId: string, status: 'accepted' | 'rejected') => {
    setLoading(appId)

    try {
      const res = await fetch('/api/companion/application-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, applicantId, status, postId, groupChatId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(`오류가 발생했습니다: ${body?.error || res.statusText}`)
        setLoading(null)
        return
      }
    } catch (e) {
      alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(null)
      return
    }

    // 신청자에게 이메일 알림 (비동기, 실패 무시)
    fetch('/api/email/companion-application-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, applicantId, status }),
    }).catch(console.error)

    setLoading(null)
    router.refresh()
  }

  const removeMember = async (applicantId: string) => {
    if (!confirm('Remove this member from the trip group?')) return
    setLoading(applicantId)
    const supabase = createClient()

    // 상태를 'removed'로 변경 (재신청 가능 상태)
    await supabase
      .from('companion_applications')
      .update({ status: 'removed' })
      .eq('post_id', postId)
      .eq('applicant_id', applicantId)

    // 그룹 채팅방에서 제거
    if (groupChatId) {
      await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', groupChatId)
        .eq('user_id', applicantId)
    }

    // 제거된 멤버에게 알림 발송
    await supabase
      .from('notifications')
      .insert({
        user_id: applicantId,
        type: 'companion',
        title: '🚫 Removed from trip',
        message: `You have been removed from "${postTitle}". You may re-apply if you wish.`,
        reference_id: postId,
        reference_type: 'companion_post',
      })

    setLoading(null)
    router.refresh()
  }

  const pending  = applications.filter(a => a.status === 'pending')
  const accepted = applications.filter(a => a.status === 'accepted')
  const rejected = applications.filter(a => a.status === 'rejected')
  const removed  = applications.filter(a => a.status === 'removed')

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-heading text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            Applications
          </h3>
          <p className="text-sm text-subtle mt-0.5">
            Accepted <span className="text-success font-semibold">{accepted.length}</span>
            &nbsp;· Pending <span className="text-warning font-semibold">{pending.length}</span>
            &nbsp;· Rejected <span className="text-hint">{rejected.length}</span>
            {removed.length > 0 && <>&nbsp;· Removed <span className="text-red-400">{removed.length}</span></>}
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <p className="text-center text-hint py-6">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {/* 수락됨 */}
          {accepted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">
                Accepted Members ({accepted.length})
              </p>
              {accepted.map(app => <AppCard key={app.id} app={app} locale={locale} status="accepted"
                onRemove={() => removeMember(app.applicant_id)}
                onMessage={`/${locale}/messages/${app.applicant_id}?postId=${postId}`}
                loading={loading} />)}
            </div>
          )}

          {/* 대기중 */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2 mt-4">
                Pending ({pending.length})
              </p>
              {pending.map(app => <AppCard key={app.id} app={app} locale={locale} status="pending"
                onAccept={() => updateStatus(app.id, app.applicant_id, 'accepted')}
                onReject={() => updateStatus(app.id, app.applicant_id, 'rejected')}
                loading={loading} />)}
            </div>
          )}

          {/* 거절됨 */}
          {rejected.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-hint uppercase tracking-wider mb-2 mt-4">
                Rejected ({rejected.length})
              </p>
              {rejected.map(app => <AppCard key={app.id} app={app} locale={locale} status="rejected"
                loading={loading} />)}
            </div>
          )}

          {/* 강제 제거됨 */}
          {removed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 mt-4">
                Removed ({removed.length})
              </p>
              {removed.map(app => <AppCard key={app.id} app={app} locale={locale} status="removed"
                loading={loading} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AppCard({
  app, locale, status, onAccept, onReject, onRemove, onMessage, loading,
}: {
  app: Application
  locale: string
  status: string
  onAccept?: () => void
  onReject?: () => void
  onRemove?: () => void
  onMessage?: string
  loading: string | null
}) {
  const profile = app.profiles as Record<string, unknown>
  const levelInfo = getLevelInfo((profile?.travel_level as number) || 1)

  return (
    <div className={`rounded-xl p-4 border transition-all ${
      status === 'accepted' ? 'bg-success-light border-green-200'
      : status === 'rejected' ? 'bg-surface-sunken border-edge opacity-50'
      : status === 'removed'  ? 'bg-danger-light border-red-200 opacity-60'
      : 'bg-surface border-edge hover:border-edge-brand'
    }`}>
      <div className="flex items-start gap-3">
        <Link href={`/${locale}/users/${app.applicant_id}`}>
          <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 hover:opacity-80 overflow-hidden">
            {(profile?.avatar_url as string) ? (
              <img src={profile.avatar_url as string} alt="" className="w-full h-full object-cover rounded-full" />
            ) : <span className="text-hint text-sm">?</span>}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/${locale}/users/${app.applicant_id}`}>
              <span className="font-semibold text-heading hover:text-brand text-sm">
                {(profile?.full_name as string) || 'Anonymous'}
              </span>
            </Link>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
              {levelInfo.badge} Lv.{levelInfo.level}
            </span>
          </div>
          {app.message && (
            <p className="text-sm text-body mt-1.5 line-clamp-2 bg-surface-sunken rounded-lg px-2 py-1.5 italic">
              "{app.message}"
            </p>
          )}
          <p suppressHydrationWarning className="text-xs text-hint mt-1">
            {new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {status === 'pending' && (
            <>
              <Button size="sm" onClick={onAccept} disabled={loading === app.id}
                className="bg-success hover:bg-success text-white rounded-full text-xs px-3 h-7">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} disabled={loading === app.id}
                className="border-red-200 text-danger hover:bg-danger-light rounded-full text-xs px-3 h-7">
                Reject
              </Button>
            </>
          )}
          {status === 'accepted' && (
            <>
              {onMessage && (
                <Link href={onMessage}>
                  <Button size="sm" variant="outline"
                    className="border-edge-brand text-brand hover:bg-brand-light rounded-full text-xs px-3 h-7 w-full flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> DM
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="outline" onClick={onRemove} disabled={loading === app.applicant_id}
                className="border-red-200 text-red-400 hover:bg-danger-light rounded-full text-xs px-3 h-7">
                Remove
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
