'use client'

import Link from 'next/link'
import { Shield, ArrowUpRight, LayoutDashboard, Users } from 'lucide-react'

const NAV = [
  { path: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { path: '/admin/members', label: '전체 회원', icon: Users, exact: false },
] as const

interface Props {
  locale: string
  adminEmail: string
  activePath: string
  children: React.ReactNode
}

export default function AdminShell({ locale, adminEmail, activePath, children }: Props) {
  const base = `/${locale}`

  return (
    <div className="min-h-screen bg-surface-sunken">
      <header className="bg-white border-b border-edge shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-heading">mytripfy 관리자</h1>
              <p className="text-xs text-subtle truncate">{adminEmail}</p>
            </div>
          </div>
          <Link
            href={base}
            className="text-sm text-brand hover:text-brand-strong font-medium flex items-center gap-1 shrink-0"
          >
            사이트로 이동
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 border-t border-edge">
          {NAV.map(item => {
            const href = `${base}${item.path}`
            const isActive = item.exact
              ? activePath === item.path
              : activePath.startsWith(item.path)

            return (
              <Link
                key={item.path}
                href={href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-subtle hover:text-heading hover:border-edge-strong'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
