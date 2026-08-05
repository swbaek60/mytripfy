'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'
import { useTranslations } from 'next-intl'

type CompanionPost = {
  id: string
  title: string
  destination_country: string
  start_date: string
  status: string
  companion_applications?: { count: number }[]
}

type GuideRequest = {
  id: string
  title: string
  destination_country: string
  start_date: string
  status?: string
  guide_applications?: { count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-success-muted text-success-strong',
  closed: 'bg-surface-sunken text-body',
  completed: 'bg-brand-muted text-brand-hover',
}

export default function MyPostsSection({
  myPosts,
  myGuideRequests,
  locale,
}: {
  myPosts: CompanionPost[] | null
  myGuideRequests: GuideRequest[] | null
  locale: string
}) {
  const t = useTranslations('Dashboard')
  const tc = useTranslations('Common')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // DB 는 상태를 영어 코드로 저장한다. 화면에는 로케일 문구로 바꿔 보여준다.
  const statusLabel = (status: string) =>
    ({
      open: tc('statusOpen'),
      closed: tc('statusClosed'),
      completed: tc('statusCompleted'),
      ended: tc('statusEnded'),
    })[status] ?? status

  const filterOptions = [
    { value: 'all', label: t('all') },
    { value: 'open', label: tc('statusOpen') },
    { value: 'closed', label: tc('statusClosed') },
    { value: 'completed', label: tc('statusCompleted') },
  ]

  const posts = (myPosts || []).filter(
    (p) => statusFilter === 'all' || p.status === statusFilter
  )
  const guideReqs = (myGuideRequests || []).filter(
    (r) => statusFilter === 'all' || r.status === statusFilter
  )
  const totalShown = posts.length + guideReqs.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-body">
          {t('statusFilter')}:
        </span>
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-brand text-white'
                : 'bg-surface-sunken text-body hover:bg-surface-hover'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-xs text-hint ml-1">
          ({tc('itemCount', { count: totalShown })})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Trips */}
        <div className="bg-surface rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-heading">
              {t('myTrips')} ({posts.length})
            </h2>
            <Link href={`/${locale}/companions/new`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-edge-brand text-brand">
                + {tc('new')}
              </Button>
            </Link>
          </div>
          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post) => {
                const country = getCountryByCode(post.destination_country)
                const appCount = (post.companion_applications as { count: number }[])?.[0]?.count ?? 0
                return (
                  <Link key={post.id} href={`/${locale}/companions/${post.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors border border-edge cursor-pointer">
                      <span className="text-xl shrink-0">{country?.emoji || '🌍'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-heading truncate text-sm">{post.title}</p>
                        <p className="text-xs text-subtle">
                          {new Date(post.start_date).toLocaleDateString(locale)} · {appCount} {t('applicants')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[post.status] || 'bg-surface-sunken text-body'}`}>
                        {statusLabel(post.status)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-hint text-sm">
              {statusFilter === 'all' ? t('noTripsYet') : t('noGuideRequestsYetFilter')}
              {statusFilter === 'all' && (
                <Link href={`/${locale}/companions/new`}>
                  <Button variant="link" className="text-brand text-sm mt-1 block">+ {t('postFirstTrip')}</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* My Guide Requests */}
        <div className="bg-surface rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-heading">
              {t('myGuideRequestsTitle')} ({guideReqs.length})
            </h2>
            <Link href={`/${locale}/guides/requests/new`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-warning-border text-warning">
                + {tc('new')}
              </Button>
            </Link>
          </div>
          {guideReqs.length > 0 ? (
            <div className="space-y-3">
              {guideReqs.map((req) => {
                const country = getCountryByCode(req.destination_country)
                const appCount = (req.guide_applications as { count: number }[])?.[0]?.count ?? 0
                return (
                  <Link key={req.id} href={`/${locale}/guides/requests/${req.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors border border-edge cursor-pointer">
                      <span className="text-xl shrink-0">{country?.emoji || '🌍'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-heading truncate text-sm">{req.title}</p>
                        <p className="text-xs text-subtle">
                          {new Date(req.start_date).toLocaleDateString(locale)} · {appCount} {t('applied')}
                        </p>
                      </div>
                      {req.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[req.status] || 'bg-surface-sunken text-body'}`}>
                          {statusLabel(req.status)}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-warning-muted text-warning-strong">
                        {tc('guide')}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-hint text-sm">
              {statusFilter === 'all' ? t('noGuideApps') : t('noGuideRequestsYetFilter')}
              {statusFilter === 'all' && (
                <Link href={`/${locale}/guides/requests/new`}>
                  <Button variant="link" className="text-warning text-sm mt-1 block">+ {t('postGuideRequest')}</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
