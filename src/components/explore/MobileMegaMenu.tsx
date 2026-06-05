'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MegaMenuGroup, NavPrimaryLink } from '@/components/explore/ExploreMegaMenu'

const GROUP_ACCENT: Record<string, string> = {
  discover: 'bg-brand',
  play: 'bg-challenge',
  community: 'bg-teal-500',
  host: 'bg-gold',
}

interface Props {
  primaryLinks: NavPrimaryLink[]
  groups: MegaMenuGroup[]
  locale: string
  pathname: string
  onNavigate: () => void
}

export default function MobileMegaMenu({ primaryLinks, groups, locale, pathname, onNavigate }: Props) {
  const [openId, setOpenId] = useState<string | null>('discover')

  const isLinkActive = (href: string) => {
    const path = href.split('?')[0]
    return pathname.includes(path)
  }

  return (
    <div className="px-3 py-3 space-y-3">
      <div className="grid grid-cols-1 gap-2 px-1">
        {primaryLinks.map((link, i) => {
          const active = isLinkActive(link.href)
          return (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              onClick={onNavigate}
              className={cn(
                'flex items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-colors',
                i === 0
                  ? active
                    ? 'bg-brand-hover text-white shadow-sm'
                    : 'bg-brand text-white hover:bg-brand-hover shadow-sm'
                  : active
                    ? 'bg-brand-light text-brand ring-2 ring-brand/30'
                    : 'bg-surface border-2 border-brand/25 text-brand hover:bg-brand-light'
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      <div className="space-y-1">
      {groups.map(group => {
        const expanded = openId === group.id
        const accent = GROUP_ACCENT[group.id] ?? 'bg-brand'
        return (
          <div key={group.id} className="rounded-2xl border border-edge/60 overflow-hidden bg-surface">
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : group.id)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-hover"
            >
              <span className={cn('h-2 w-2 rounded-full shrink-0', accent)} />
              <span className="flex-1 text-sm font-bold text-heading">{group.label}</span>
              <ChevronDown
                className={cn('w-4 h-4 text-hint transition-transform', expanded && 'rotate-180')}
              />
            </button>
            {expanded && (
              <div className="border-t border-edge/40 bg-surface-sunken/40 px-2 py-2 space-y-0.5">
                {group.links.map(link => {
                  const active = isLinkActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={`/${locale}${link.href}`}
                      onClick={onNavigate}
                      className={cn(
                        'block rounded-xl px-3 py-2.5 transition-colors',
                        active ? 'bg-brand-light' : 'hover:bg-surface-hover'
                      )}
                    >
                      <span className={cn('text-sm font-semibold', active ? 'text-brand' : 'text-heading')}>
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
  )
}
