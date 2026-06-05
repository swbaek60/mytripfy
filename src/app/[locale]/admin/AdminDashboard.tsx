'use client'

import Link from 'next/link'
import {
  Users,
  UserCheck,
  MapPin,
  Briefcase,
  TrendingUp,
  Store,
  Shield,
  ArrowUpRight,
  Clock,
  Globe,
} from 'lucide-react'

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
  adminEmail: string
  locale: string
}

const statCards = (stats: Stats) => [
  {
    label: '총 회원수',
    value: stats.totalMembers.toLocaleString(),
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    sub: `이번 달 +${stats.newMembersThisMonth}명 신규 가입`,
  },
  {
    label: '활성 동행구하기',
    value: stats.activeCompanions.toLocaleString(),
    icon: MapPin,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    sub: '현재 모집 중인 포스트',
  },
  {
    label: '등록된 가이드',
    value: stats.totalGuides.toLocaleString(),
    icon: UserCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    sub: '프로필에 가이드 등록된 회원',
  },
  {
    label: '가이드 요청 (활성)',
    value: stats.totalGuideRequests.toLocaleString(),
    icon: Briefcase,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    sub: '현재 오픈 상태인 가이드 요청',
  },
  {
    label: '총 여행 포스트',
    value: stats.totalTrips.toLocaleString(),
    icon: Globe,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    sub: '누적 여행 일정 포스트',
  },
  {
    label: '스폰서/업체',
    value: stats.totalSponsors.toLocaleString(),
    icon: Store,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
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

export default function AdminDashboard({ stats, recentMembers, recentCompanions, adminEmail, locale }: Props) {
  const cards = statCards(stats)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">mytripfy 관리자</h1>
              <p className="text-xs text-gray-500">{adminEmail}</p>
            </div>
          </div>
          <Link
            href={`/${locale}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            사이트로 이동
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 타이틀 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            기준: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 두 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 가입 회원 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">최근 가입 회원</h3>
              </div>
              <span className="text-xs text-gray-400">최근 10명</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentMembers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">데이터 없음</p>
              ) : (
                recentMembers.map((m) => (
                  <div key={m.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                        {(m.full_name ?? m.email ?? '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.full_name ?? '(이름 없음)'}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email ?? ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{timeAgo(m.created_at)}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        {m.is_guide && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">가이드</span>
                        )}
                        {(m.travel_count ?? 0) > 0 && (
                          <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-medium">{m.travel_count}개국</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 최근 동행구하기 포스트 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">최근 동행구하기 포스트</h3>
              </div>
              <span className="text-xs text-gray-400">최근 8개</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentCompanions.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">데이터 없음</p>
              ) : (
                recentCompanions.map((c) => {
                  const profile = c.profiles as { full_name: string | null; email: string | null } | null
                  const isActive = c.status === 'open'
                  return (
                    <div key={c.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.title ?? '(제목 없음)'}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {profile?.full_name ?? profile?.email ?? '알 수 없음'} ·{' '}
                            {c.destination_country ?? '미정'}
                          </p>
                          {c.start_date && c.end_date && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(c.start_date)} ~ {formatDate(c.end_date)}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {isActive ? '모집중' : c.status ?? ''}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(c.created_at)}</p>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">빠른 이동</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '동행구하기 목록', href: `/${locale}/companions` },
              { label: '가이드 목록', href: `/${locale}/guides` },
              { label: '여행 포스트', href: `/${locale}/trips` },
              { label: '스폰서', href: `/${locale}/sponsors` },
              { label: '명예의 전당', href: `/${locale}/hall-of-fame` },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full font-medium transition-colors"
              >
                {link.label}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
