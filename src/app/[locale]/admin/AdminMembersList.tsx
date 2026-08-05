'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'

export interface AdminMemberRow {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  is_guide: boolean | null
  travel_count: number | null
  travel_level: number | null
  trust_score: number | null
  nationality: string | null
  email_verified: boolean | null
}

interface Props {
  members: AdminMemberRow[]
  locale: string
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminMembersList({
  members,
  locale,
  page,
  totalPages,
  totalCount,
  pageSize,
}: Props) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)
  const baseUrl = `/${locale}/admin/members`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-heading">전체 회원</h2>
        <p className="text-sm text-subtle mt-1">
          총 {totalCount.toLocaleString()}명 · 페이지당 {pageSize}명
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-edge overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-sunken border-b border-edge text-left text-xs font-semibold text-subtle uppercase tracking-wide">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3 min-w-[180px]">회원</th>
                <th className="px-4 py-3 min-w-[200px]">이메일</th>
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3">레벨</th>
                <th className="px-4 py-3">신뢰점수</th>
                <th className="px-4 py-3">여행국</th>
                <th className="px-4 py-3">구분</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-hint">
                    회원이 없습니다.
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => {
                  const rowNum = (page - 1) * pageSize + idx + 1
                  return (
                    <tr key={m.id} className="hover:bg-surface-sunken/80 transition-colors">
                      <td className="px-4 py-3 text-hint tabular-nums">{rowNum}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {m.avatar_url ? (
                            <Avatar src={m.avatar_url} size={32} className="bg-surface-hover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-edge flex items-center justify-center shrink-0 text-xs font-bold text-subtle">
                              {(m.full_name ?? m.email ?? '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/${locale}/users/${m.id}`}
                              className="font-medium text-heading hover:text-brand truncate block"
                            >
                              {m.full_name ?? '(이름 없음)'}
                            </Link>
                            <p className="text-[10px] text-hint truncate font-mono">{m.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-subtle truncate max-w-[220px]">
                        {m.email ?? '—'}
                        {m.email_verified && (
                          <span className="ml-1 text-[10px] text-success font-medium">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-subtle whitespace-nowrap">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-3 text-body tabular-nums">Lv.{m.travel_level ?? 1}</td>
                      <td className="px-4 py-3 text-body tabular-nums">
                        {m.trust_score != null && m.trust_score > 0 ? m.trust_score.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3 text-body tabular-nums">{m.travel_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {m.is_guide && (
                            <span className="text-[10px] bg-purple-muted text-purple-strong px-1.5 py-0.5 rounded-full font-medium">
                              가이드
                            </span>
                          )}
                          {m.nationality && (
                            <span className="text-[10px] bg-surface-hover text-subtle px-1.5 py-0.5 rounded-full font-medium">
                              {m.nationality}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-edge flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              {from.toLocaleString()}–{to.toLocaleString()} / {totalCount.toLocaleString()}명
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={page > 1 ? `${baseUrl}?page=${page - 1}` : `${baseUrl}?page=1`}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  page <= 1
                    ? 'border-edge text-hint pointer-events-none'
                    : 'border-edge text-body hover:bg-surface-sunken'
                }`}
                aria-disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </Link>
              <span className="text-sm text-subtle px-2 tabular-nums">
                {page} / {totalPages}
              </span>
              <Link
                href={page < totalPages ? `${baseUrl}?page=${page + 1}` : `${baseUrl}?page=${totalPages}`}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  page >= totalPages
                    ? 'border-edge text-hint pointer-events-none'
                    : 'border-edge text-body hover:bg-surface-sunken'
                }`}
                aria-disabled={page >= totalPages}
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
