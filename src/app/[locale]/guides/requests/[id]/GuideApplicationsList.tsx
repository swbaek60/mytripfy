'use client'

import { useState } from 'react'
import { api, errorMessage } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { getLevelInfo } from '@/data/countries'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'
import TranslatedText from '@/components/TranslatedText'
import Avatar from '@/components/ui/Avatar'

interface GuideApplication {
  id: string
  guide_id: string
  message: string | null
  status: string
  created_at: string
  profiles: Record<string, unknown>
}

export default function GuideApplicationsList({
  applications,
  requestId,
  locale,
}: {
  applications: GuideApplication[]
  requestId: string
  locale: string
}) {
  const router = useRouter()
  const t = useTranslations('GuideRequests')
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (appId: string, status: 'accepted' | 'rejected', guideId: string) => {
    setLoading(appId)
    try {
      await api.patch('/api/guide-applications', { appId, status })
      // 가이드 알림 메일은 실패해도 상태 변경을 되돌리지 않는다.
      api.post('/api/email/guide-application-status', { requestId, guideId, status }).catch(() => {})
      router.refresh()
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const pending = applications.filter(a => a.status === 'pending')
  const accepted = applications.filter(a => a.status === 'accepted')
  const rejected = applications.filter(a => a.status === 'rejected')

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-6">
      <div>
        <h3 className="font-bold text-heading text-lg flex items-center gap-2">
          🧭 {t('guideApplications')}
        </h3>
        <p className="text-sm text-subtle mt-0.5">
          {t('accepted')} <span className="text-success font-semibold">{accepted.length}</span>
          &nbsp;· {t('pending')} <span className="text-gold font-semibold">{pending.length}</span>
          &nbsp;· {t('rejected')} <span className="text-hint">{rejected.length}</span>
        </p>
      </div>

      {applications.length === 0 ? (
        <p className="text-center text-hint py-6">{t('noApplications')}</p>
      ) : (
        <div className="space-y-3">
          {accepted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">{t('accepted')}</p>
              {accepted.map(app => (
                <GuideAppCard
                  key={app.id}
                  app={app}
                  locale={locale}
                  status="accepted"
                  onMessage={`/${locale}/messages/${app.guide_id}`}
                  loading={loading}
                />
              ))}
            </div>
          )}
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gold-strong uppercase tracking-wider mb-2 mt-4">{t('pending')}</p>
              {pending.map(app => (
                <GuideAppCard
                  key={app.id}
                  app={app}
                  locale={locale}
                  status="pending"
                  onAccept={() => updateStatus(app.id, 'accepted', app.guide_id)}
                  onReject={() => updateStatus(app.id, 'rejected', app.guide_id)}
                  loading={loading}
                />
              ))}
            </div>
          )}
          {rejected.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-hint uppercase tracking-wider mb-2 mt-4">{t('rejected')}</p>
              {rejected.map(app => (
                <GuideAppCard key={app.id} app={app} locale={locale} status="rejected" loading={loading} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GuideAppCard({
  app,
  locale,
  status,
  onAccept,
  onReject,
  onMessage,
  loading,
}: {
  app: GuideApplication
  locale: string
  status: string
  onAccept?: () => void
  onReject?: () => void
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
      : 'bg-surface border-edge hover:border-warning-border'
    }`}>
      <div className="flex items-start gap-3">
        <Link href={`/${locale}/guides/${app.guide_id}`}>
          <div className="w-10 h-10 rounded-full bg-warning-muted flex items-center justify-center shrink-0 hover:opacity-80 overflow-hidden">
            {(profile?.avatar_url as string) ? (
              <Avatar src={profile.avatar_url as string} size={40} fill />
            ) : <span className="text-warning text-sm">?</span>}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/${locale}/guides/${app.guide_id}`}>
              <span className="font-semibold text-heading hover:text-warning text-sm">
                {(profile?.full_name as string) || tc('localGuide')}
              </span>
            </Link>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
              Lv.{levelInfo.level}
            </span>
          </div>
          {app.message && (
            <div className="text-sm text-body mt-1.5 bg-surface-sunken rounded-lg px-2 py-1.5 italic">
              <TranslatedText
                text={`"${app.message}"`}
                locale={locale}
                as="p"
                className="line-clamp-2"
              />
            </div>
          )}
          <p suppressHydrationWarning className="text-xs text-hint mt-1">
            {new Date(app.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {status === 'pending' && onAccept && onReject && (
            <>
              <Button size="sm" onClick={onAccept} disabled={loading === app.id}
                className="bg-success-strong text-white rounded-full text-xs px-3 h-7">
                {tc('accept')}
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} disabled={loading === app.id}
                className="border-danger-border text-danger hover:bg-danger-light rounded-full text-xs px-3 h-7">
                {tc('reject')}
              </Button>
            </>
          )}
          {status === 'accepted' && onMessage && (
            <Link href={onMessage}>
              <Button size="sm" variant="outline" className="border-warning-border text-warning hover:bg-warning-light rounded-full text-xs px-3 h-7 flex items-center gap-1 w-full">
                <MessageSquare className="w-3 h-3" /> {tc('message')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
