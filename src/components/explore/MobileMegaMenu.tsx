'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Compass, LogIn, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MegaMenuGroup, NavPrimaryLink } from '@/components/explore/ExploreMegaMenu'

const GROUP_ACCENT: Record<string, string> = {
  discover: 'bg-brand',
  play: 'bg-challenge',
  community: 'bg-teal-500',
  host: 'bg-gold',
}

const PRIMARY_META: Record<string, { icon: typeof Users; accent: string; iconBg: string }> = {
  '/companions': { icon: Users, accent: 'text-brand', iconBg: 'bg-brand-light' },
  '/guides': { icon: Compass, accent: 'text-teal-600', iconBg: 'bg-teal-500/10' },
}

interface Props {
  guestLogin?: { href: string; label: string }
  primaryLinks: NavPrimaryLink[]
  groups: MegaMenuGroup[]
  locale: string
  pathname: string
  onNavigate: () => void
  moreLabel: string
  accountLabel: string
}

export default function MobileMegaMenu({
  guestLogin,
  primaryLinks,
  groups,
  locale,
  pathname,
  onNavigate,
  moreLabel,
  accountLabel,
}: Props) {
  const [openId, setOpenId] = useState<string | null>('discover')

  const isLinkActive = (href: string) => {
    const path = href.split('?')[0]
    return pathname.includes(path)
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {/* ── 히어로 CTA: 로그인 + 핵심 메뉴 (아코디언과 구분) ── */}
      <div className="space-y-3 rounded-2xl bg-surface-sunken/60 p-3 ring-1 ring-edge/40">
        {guestLogin && (
          <Link
            href={guestLogin.href}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-2xl bg-gradient-to-br from-midnight via-midnight to-brand/85 px-4 py-4 text-white shadow-md transition-transform active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <LogIn className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-white/60">
                {accountLabel}
              </span>
              <span className="block text-base font-bold leading-tight">{guestLogin.label}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        <div className="space-y-2">
          {primaryLinks.map(link => {
            const path = link.href.split('?')[0]
            const meta = PRIMARY_META[path] ?? PRIMARY_META['/companions']
            const Icon = meta.icon
            const active = isLinkActive(link.href)
            return (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-3.5 shadow-sm transition-all active:scale-[0.99]',
                  active
                    ? 'border-brand/40 ring-2 ring-brand/20'
                    : 'border-edge/50 hover:border-brand/25 hover:shadow-md'
                )}
              >
                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', meta.iconBg)}>
                  <Icon className={cn('h-5 w-5', meta.accent)} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm font-bold leading-tight', active ? 'text-brand' : 'text-heading')}>
                    {link.label}
                  </span>
                  {link.description && (
                    <span className="mt-0.5 block text-xs leading-snug text-hint line-clamp-2">
                      {link.description}
                    </span>
                  )}
                </span>
                <ChevronRight className={cn('h-4 w-4 shrink-0 text-hint/60 transition-transform group-hover:translate-x-0.5', active && 'text-brand')} />
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── 구분선 + 아코디언 메뉴 ── */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-edge/70" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-hint">{moreLabel}</span>
          <span className="h-px flex-1 bg-edge/70" />
        </div>

        <div className="space-y-1.5">
          {groups.map(group => {
            const expanded = openId === group.id
            const accent = GROUP_ACCENT[group.id] ?? 'bg-brand'
            return (
              <div key={group.id} className="overflow-hidden rounded-xl border border-edge/50 bg-surface">
                <button
                  type="button"
                  onClick={() => setOpenId(expanded ? null : group.id)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-surface-hover"
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', accent)} />
                  <span className="flex-1 text-sm font-semibold text-body">{group.label}</span>
                  <ChevronDown
                    className={cn('w-4 h-4 text-hint transition-transform', expanded && 'rotate-180')}
                  />
                </button>
                {expanded && (
                  <div className="border-t border-edge/40 bg-surface-sunken/30 px-2 py-1.5 space-y-0.5">
                    {group.links.map(link => {
                      const active = isLinkActive(link.href)
                      return (
                        <Link
                          key={link.href}
                          href={`/${locale}${link.href}`}
                          onClick={onNavigate}
                          className={cn(
                            'block rounded-lg px-3 py-2.5 transition-colors',
                            active ? 'bg-brand-light' : 'hover:bg-surface-hover'
                          )}
                        >
                          <span className={cn('text-sm font-medium', active ? 'text-brand' : 'text-heading')}>
                            {link.label}
                          </span>
                          {link.description && (
                            <span className="block text-xs text-hint mt-0.5 leading-snug">{link.description}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
