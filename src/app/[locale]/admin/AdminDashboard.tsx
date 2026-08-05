'use client'

import Link from 'next/link'
import {
  Users,
  UserCheck,
  MapPin,
  Briefcase,
  TrendingUp,
  Store,
  ArrowUpRight,
  Clock,
  Globe,
  Target,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import type { BeachheadCityStats } from '@/lib/admin/beachhead-cities'

interface Stats {
  totalMembers: number
  activeCompanions: number
  totalGuides: number
  totalTrips: number
  totalGuideRequests: number
  newMembersThisMonth: number
  totalSponsors: number
}

interface Member {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  is_guide: boolean | null
  travel_count: number | null
}

interface CompanionPost {
  id: string
  title: string | null
  destination_country: string | null
  start_date: string | null
  end_date: string | null
  status: string | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

interface Props {
  stats: Stats
  recentMembers: Member[]
  recentCompanions: CompanionPost[]
  beachheadStats: BeachheadCityStats[]
  locale: string
}

const statCards = (stats: Stats) => [
  {
    label: '총 회원수',
    value: stats.totalMembers.toLocaleString(),
    icon: Users,
    color: 'text-brand',
    bg: 'bg-brand-light',
    sub: `이번 달 +${stats.newMembersThisMonth}명 신규 가입`,
  },
  {
    label: '활성 동행구하기',
    value: stats.activeCompanions.toLocaleString(),
    icon: MapPin,
    color: 'text-success',
    bg: 'bg-success-light',
    sub: '현재 모집 중인 포스트',
  },
  {
    label: '등록된 가이드',
    value: stats.totalGuides.toLocaleString(),
    icon: UserCheck,
    color: 'text-purple',
    bg: 'bg-purple-light',
    sub: '프로필에 가이드 등록된 회원',
  },
  {
    label: '가이드 요청 (활성)',
    value: stats.totalGuideRequests.toLocaleString(),
    icon: Briefcase,
    color: 'text-sunset',
    bg: 'bg-sunset-light',
    sub: '현재 오픈 상태인 가이드 요청',
  },
  {
    label: '총 여행 포스트',
    value: stats.totalTrips.toLocaleString(),
    icon: Globe,
    color: 'text-teal-strong',
    bg: 'bg-teal-light',
    sub: '누적 여행 일정 포스트',
  },
  {
    label: '스폰서/업체',
    value: stats.totalSponsors.toLocaleString(),
    icon: Store,
    color: 'text-challenge',
    bg: 'bg-challenge-light',
    sub: '등록된 스폰서 업체',
  },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '오늘'
  if (days === 1) return '1일 전'
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  return `${Math.floor(days / 30)}개월 전`
}

export default function AdminDashboard({ stats, recentMembers, recentCompanions, beachheadStats, locale }: Props) {
  const cards = statCards(stats)

  return (
    <div className="space-y-8">
        {/* 타이틀 */}
        <div>
          <h2 className="text-2xl font-bold text-heading">대시보드</h2>
          <p className="text-sm text-subtle mt-1 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            기준: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const isMembersCard = card.label === '총 회원수'
            const cardInner = (
            <div key={card.label} className={`bg-white rounded-2xl p-5 shadow-sm border border-edge ${isMembersCard ? 'hover:border-edge-brand hover:shadow-md transition-all' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-subtle font-medium">{card.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-hint mt-2">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
            )
            return isMembersCard ? (
              <Link key={card.label} href={`/${locale}/admin/members`}>
                {cardInner}
              </Link>
            ) : (
              cardInner
            )
          })}
        </div>

        {/* Beachhead cities KPI */}
        <div className="bg-white rounded-2xl shadow-sm border border-edge overflow-hidden">
          <div className="px-5 py-4 border-b border-edge flex items-center gap-2">
            <Target className="w-5 h-5 text-sunset" />
            <h3 className="font-semibold text-heading">Beachhead 도시 KPI</h3>
            <span className="text-xs text-hint ml-auto">목표: 동행 20+ · 스폰서 10+</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-subtle border-b border-edge">
                  <th className="px-5 py-3 font-medium">도시</th>
                  <th className="px-5 py-3 font-medium">활성 동행</th>
                  <th className="px-5 py-3 font-medium">스폰서</th>
                  <th className="px-5 py-3 font-medium">밀도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {beachheadStats.map(row => {
                  const postPct = Math.min(100, Math.round((row.activePosts / row.targetActivePosts) * 100))
                  const sponsorPct = Math.min(100, Math.round((row.sponsors / row.targetSponsors) * 100))
                  const overall = Math.round((postPct + sponsorPct) / 2)
                  return (
                    <tr key={row.id} className="hover:bg-surface-sunken">
                      <td className="px-5 py-3 font-medium text-heading">{row.label}</td>
                      <td className="px-5 py-3">
                        <span className={row.activePosts >= row.targetActivePosts ? 'text-success font-semibold' : 'text-body'}>
                          {row.activePosts}/{row.targetActivePosts}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={row.sponsors >= row.targetSponsors ? 'text-success font-semibold' : 'text-body'}>
                          {row.sponsors}/{row.targetSponsors}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-surface-hover rounded-full overflow-hidden">
                            <div className="h-full bg-sunset rounded-full" style={{ width: `${overall}%` }} />
                          </div>
                          <span className="text-xs text-subtle">{overall}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 두 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 가입 회원 */}
          <div className="bg-white rounded-2xl shadow-sm border border-edge overflow-hidden">
            <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand" />
                <h3 className="font-semibold text-heading">최근 가입 회원</h3>
              </div>
              <Link
                href={`/${locale}/admin/members`}
                className="text-xs text-brand hover:text-brand-strong font-medium flex items-center gap-0.5"
              >
                전체 보기
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-edge">
              {recentMembers.length === 0 ? (
                <p className="text-center text-sm text-hint py-8">데이터 없음</p>
              ) : (
                recentMembers.map((m) => (
                  <div key={m.id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-sunken transition-colors">
                    {m.avatar_url ? (
                      <Avatar src={m.avatar_url} size={32} className="bg-surface-hover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-edge flex items-center justify-center shrink-0 text-xs font-bold text-subtle">
                        {(m.full_name ?? m.email ?? '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-heading truncate">{m.full_name ?? '(이름 없음)'}</p>
                      <p className="text-xs text-hint truncate">{m.email ?? ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-hint">{timeAgo(m.created_at)}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        {m.is_guide && (
                          <span className="text-[10px] bg-purple-muted text-purple-strong px-1.5 py-0.5 rounded-full font-medium">가이드</span>
                        )}
                        {(m.travel_count ?? 0) > 0 && (
                          <span className="text-[10px] bg-teal-muted text-teal-strong px-1.5 py-0.5 rounded-full font-medium">{m.travel_count}개국</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 최근 동행구하기 포스트 */}
          <div className="bg-white rounded-2xl shadow-sm border border-edge overflow-hidden">
            <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-success" />
                <h3 className="font-semibold text-heading">최근 동행구하기 포스트</h3>
              </div>
              <span className="text-xs text-hint">최근 8개</span>
            </div>
            <div className="divide-y divide-edge">
              {recentCompanions.length === 0 ? (
                <p className="text-center text-sm text-hint py-8">데이터 없음</p>
              ) : (
                recentCompanions.map((c) => {
                  const profile = c.profiles as { full_name: string | null; email: string | null } | null
                  const isActive = c.status === 'open'
                  return (
                    <div key={c.id} className="px-5 py-3 hover:bg-surface-sunken transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-heading truncate">{c.title ?? '(제목 없음)'}</p>
                          <p className="text-xs text-hint mt-0.5 truncate">
                            {profile?.full_name ?? profile?.email ?? '알 수 없음'} ·{' '}
                            {c.destination_country ?? '미정'}
                          </p>
                          {c.start_date && c.end_date && (
                            <p className="text-xs text-hint mt-0.5">
                              {formatDate(c.start_date)} ~ {formatDate(c.end_date)}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              isActive ? 'bg-success-muted text-success-strong' : 'bg-surface-hover text-subtle'
                            }`}
                          >
                            {isActive ? '모집중' : c.status ?? ''}
                          </span>
                          <p className="text-xs text-hint mt-1">{timeAgo(c.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="bg-white rounded-2xl shadow-sm border border-edge p-5">
          <h3 className="font-semibold text-heading mb-4">빠른 이동</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '전체 회원', href: `/${locale}/admin/members` },
              { label: '동행구하기 목록', href: `/${locale}/companions` },
              { label: '가이드 목록', href: `/${locale}/guides` },
              { label: '여행 포스트', href: `/${locale}/trips` },
              { label: '스폰서', href: `/${locale}/sponsors` },
              { label: '명예의 전당', href: `/${locale}/hall-of-fame` },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 text-sm text-brand-strong hover:text-brand-strong bg-brand-light hover:bg-brand-muted px-3 py-1.5 rounded-full font-medium transition-colors"
              >
                {link.label}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
    </div>
  )
}
