'use client'

import { useState } from 'react'
import { api, errorMessage } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { getLevelInfo } from '@/data/countries'
import Link from 'next/link'
import { MessageSquare, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import TranslatedText from '@/components/TranslatedText'
import Avatar from '@/components/ui/Avatar'

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
  locale,
}: {
  applications: Application[]
  postId: string
  locale: string
}) {
  const router = useRouter()
  const t = useTranslations('CompanionDetail')
  const tc = useTranslations('Common')
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (appId: string, applicantId: string, status: 'accepted' | 'rejected') => {
    setLoading(appId)
    try {
      await api.post('/api/companion/application-status', { appId, status })
      // 신청자 이메일 알림은 실패해도 상태 변경을 되돌리지 않는다.
      api.post('/api/email/companion-application-status', { postId, applicantId, status }).catch(() => {})
      router.refresh()
    } catch (err) {
      alert(errorMessage(err, tc('errorUnexpected')))
    } finally {
      setLoading(null)
    }
  }

  const removeMember = async (appId: string, applicantId: string) => {
    if (!confirm(t('qaRemoveConfirm'))) return
    setLoading(applicantId)
    try {
      await api.post('/api/companion/application-status', { appId, status: 'removed' })
      router.refresh()
    } catch (err) {
      alert(errorMessage(err, tc('errorUnexpected')))
    } finally {
      setLoading(null)
    }
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
            {t('qaApplications')}
          </h3>
          <p className="text-sm text-subtle mt-0.5">
            {tc('accepted')} <span className="text-success font-semibold">{accepted.length}</span>
            &nbsp;· {tc('pending')} <span className="text-warning font-semibold">{pending.length}</span>
            &nbsp;· {tc('rejected')} <span className="text-hint">{rejected.length}</span>
            {removed.length > 0 && <>&nbsp;· {tc('removed')} <span className="text-danger">{removed.length}</span></>}
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <p className="text-center text-hint py-6">{t('noApplications')}</p>
      ) : (
        <div className="space-y-3">
          {/* 수락됨 */}
          {accepted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">
                {t('qaAcceptedMembers')} ({accepted.length})
              </p>
              {accepted.map(app => <AppCard key={app.id} app={app} locale={locale} status="accepted"
                onRemove={() => removeMember(app.id, app.applicant_id)}
                onMessage={`/${locale}/messages/${app.applicant_id}?postId=${postId}`}
                loading={loading} />)}
            </div>
          )}

          {/* 대기중 */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gold-strong uppercase tracking-wider mb-2 mt-4">
                {tc('pending')} ({pending.length})
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
                {tc('rejected')} ({rejected.length})
              </p>
              {rejected.map(app => <AppCard key={app.id} app={app} locale={locale} status="rejected"
                loading={loading} />)}
            </div>
          )}

          {/* 강제 제거됨 */}
          {removed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-danger uppercase tracking-wider mb-2 mt-4">
                {tc('removed')} ({removed.length})
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
  const tc = useTranslations('Common')
  const profile = app.profiles as Record<string, unknown>
  const levelInfo = getLevelInfo((profile?.travel_level as number) || 1)

  return (
    <div className={`rounded-xl p-4 border transition-all ${
      status === 'accepted' ? 'bg-success-light border-success-border'
      : status === 'rejected' ? 'bg-surface-sunken border-edge opacity-50'
      : status === 'removed'  ? 'bg-danger-light border-danger-border opacity-60'
      : 'bg-surface border-edge hover:border-edge-brand'
    }`}>
      <div className="flex items-start gap-3">
        <Link href={`/${locale}/users/${app.applicant_id}`}>
          <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 hover:opacity-80 overflow-hidden">
            {(profile?.avatar_url as string) ? (
              <Avatar src={profile.avatar_url as string} size={40} fill />
            ) : <span className="text-hint text-sm">?</span>}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/${locale}/users/${app.applicant_id}`}>
              <span className="font-semibold text-heading hover:text-brand text-sm">
                {(profile?.full_name as string) || tc('anonymous')}
              </span>
            </Link>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
              {levelInfo.badge} Lv.{levelInfo.level}
            </span>
          </div>
          {app.message && (
            <div className="text-sm text-body mt-1.5 bg-surface-sunken rounded-lg px-2 py-1.5 italic">
              <TranslatedText text={`"${app.message}"`} locale={locale} as="p" className="line-clamp-2" />
            </div>
          )}
          <p suppressHydrationWarning className="text-xs text-hint mt-1">
            {new Date(app.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {status === 'pending' && (
            <>
              <Button size="sm" onClick={onAccept} disabled={loading === app.id}
                className="bg-success-strong hover:bg-success text-white rounded-full text-xs px-3 h-7">
                {tc('accept')}
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} disabled={loading === app.id}
                className="border-danger-border text-danger hover:bg-danger-light rounded-full text-xs px-3 h-7">
                {tc('reject')}
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
                className="border-danger-border text-danger hover:bg-danger-light rounded-full text-xs px-3 h-7">
                {tc('remove')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
