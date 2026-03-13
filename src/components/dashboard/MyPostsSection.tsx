'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCountryByCode } from '@/data/countries'

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
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const isKo = locale.startsWith('ko')

  const filterOptions = [
    { value: 'all', label: isKo ? '전체' : 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'completed', label: 'Completed' },
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
        <span className="text-sm font-medium text-gray-600">
          {isKo ? '상태 필터' : 'Filter'}:
        </span>
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-1">
          ({totalShown} {isKo ? '건' : 'items'})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Trips */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">
              {isKo ? '동행 찾기' : 'My Trips'} ({posts.length})
            </h2>
            <Link href={`/${locale}/companions/new`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-blue-300 text-blue-600">
                + New
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
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer">
                      <span className="text-xl shrink-0">{country?.emoji || '🌍'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate text-sm">{post.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(post.start_date).toLocaleDateString(locale.startsWith('ko') ? 'ko-KR' : 'en-US')} · {appCount} {isKo ? '명 신청' : 'applicants'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[post.status] || 'bg-gray-100 text-gray-600'}`}>
                        {post.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              {statusFilter === 'all' ? (isKo ? '등록한 동행 글이 없습니다.' : 'No trips posted yet.') : (isKo ? '해당 상태의 글이 없습니다.' : 'No items for this filter.')}
              {statusFilter === 'all' && (
                <Link href={`/${locale}/companions/new`}>
                  <Button variant="link" className="text-blue-600 text-sm mt-1 block">+ {isKo ? '첫 동행 글 쓰기' : 'Post your first trip'}</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* My Guide Requests */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">
              {isKo ? '가이드 찾기' : 'My Guide Requests'} ({guideReqs.length})
            </h2>
            <Link href={`/${locale}/guides/requests/new`}>
              <Button variant="outline" size="sm" className="rounded-full text-xs border-amber-300 text-amber-600">
                + New
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
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer">
                      <span className="text-xl shrink-0">{country?.emoji || '🌍'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate text-sm">{req.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(req.start_date).toLocaleDateString(locale.startsWith('ko') ? 'ko-KR' : 'en-US')} · {appCount} {isKo ? '명 지원' : 'applied'}
                        </p>
                      </div>
                      {req.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                          {req.status}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-amber-100 text-amber-700">
                        Guide
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              {statusFilter === 'all' ? (isKo ? '등록한 가이드 요청이 없습니다.' : 'No guide requests yet.') : (isKo ? '해당 상태의 글이 없습니다.' : 'No items for this filter.')}
              {statusFilter === 'all' && (
                <Link href={`/${locale}/guides/requests/new`}>
                  <Button variant="link" className="text-amber-600 text-sm mt-1 block">+ {isKo ? '가이드 요청 쓰기' : 'Post a guide request'}</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
