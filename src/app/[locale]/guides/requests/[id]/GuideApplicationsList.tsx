'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { getLevelInfo } from '@/data/countries'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

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
  requestTitle,
  locale,
}: {
  applications: GuideApplication[]
  requestId: string
  requestTitle: string
  locale: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (appId: string, status: 'accepted' | 'rejected', guideId: string) => {
    setLoading(appId)
    const supabase = createClient()
    await supabase.from('guide_applications').update({ status }).eq('id', appId)
    setLoading(null)

    // 가이드에게 수락/거절 이메일 발송 (비동기)
    fetch('/api/email/guide-application-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, guideId, status }),
    }).catch(console.error)

    router.refresh()
  }

  const pending = applications.filter(a => a.status === 'pending')
  const accepted = applications.filter(a => a.status === 'accepted')
  const rejected = applications.filter(a => a.status === 'rejected')

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      <div>
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          🧭 Guide Applications
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Accepted <span className="text-green-600 font-semibold">{accepted.length}</span>
          &nbsp;· Pending <span className="text-yellow-600 font-semibold">{pending.length}</span>
          &nbsp;· Rejected <span className="text-gray-400">{rejected.length}</span>
        </p>
      </div>

      {applications.length === 0 ? (
        <p className="text-center text-gray-400 py-6">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {accepted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Accepted</p>
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
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2 mt-4">Pending</p>
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">Rejected</p>
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
  const profile = app.profiles as Record<string, unknown>
  const levelInfo = getLevelInfo((profile?.travel_level as number) || 1)

  return (
    <div className={`rounded-xl p-4 border transition-all ${
      status === 'accepted' ? 'bg-green-50 border-green-200'
      : status === 'rejected' ? 'bg-gray-50 border-gray-200 opacity-50'
      : 'bg-white border-gray-200 hover:border-amber-200'
    }`}>
      <div className="flex items-start gap-3">
        <Link href={`/${locale}/guides/${app.guide_id}`}>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 hover:opacity-80 overflow-hidden">
            {(profile?.avatar_url as string) ? (
              <img src={profile.avatar_url as string} alt="" className="w-full h-full object-cover rounded-full" />
            ) : <span className="text-amber-600 text-sm">?</span>}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/${locale}/guides/${app.guide_id}`}>
              <span className="font-semibold text-gray-900 hover:text-amber-600 text-sm">
                {(profile?.full_name as string) || 'Guide'}
              </span>
            </Link>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
              Lv.{levelInfo.level}
            </span>
          </div>
          {app.message && (
            <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 bg-gray-50 rounded-lg px-2 py-1.5 italic">
              &quot;{app.message}&quot;
            </p>
          )}
          <p suppressHydrationWarning className="text-xs text-gray-400 mt-1">
            {new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {status === 'pending' && onAccept && onReject && (
            <>
              <Button size="sm" onClick={onAccept} disabled={loading === app.id}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full text-xs px-3 h-7">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} disabled={loading === app.id}
                className="border-red-200 text-red-500 hover:bg-red-50 rounded-full text-xs px-3 h-7">
                Reject
              </Button>
            </>
          )}
          {status === 'accepted' && onMessage && (
            <Link href={onMessage}>
              <Button size="sm" variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-full text-xs px-3 h-7 flex items-center gap-1 w-full">
                <MessageSquare className="w-3 h-3" /> Message
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
