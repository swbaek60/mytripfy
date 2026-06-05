'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavPrimaryLink {
  href: string
  label: string
  description?: string
}

export interface MegaMenuGroup {
  id: string
  label: string
  links: { href: string; label: string; description?: string }[]
}

interface Props {
  primaryLinks: NavPrimaryLink[]
  groups: MegaMenuGroup[]
  locale: string
}

export default function ExploreMegaMenu({ primaryLinks, groups, locale }: Props) {
  const pathname = usePathname()
  const [openId, setOpenId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const isLinkActive = (href: string) => pathname.includes(href.split('?')[0])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenId(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <div ref={ref} className="hidden md:flex items-center gap-0.5">
      {primaryLinks.map(link => {
        const active = isLinkActive(link.href)
        return (
          <Link
            key={link.href}
            href={`/${locale}${link.href}`}
            className={cn(
              'px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap',
              active ? 'text-brand bg-brand-light' : 'text-heading hover:bg-surface-hover'
            )}
          >
            {link.label}
          </Link>
        )
      })}
      <span className="mx-1 h-5 w-px bg-edge/80 shrink-0" aria-hidden />
      {groups.map(group => (
        <div key={group.id} className="relative">
          <button
            type="button"
            onClick={() => setOpenId(openId === group.id ? null : group.id)}
            className={cn(
              'flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors',
              openId === group.id ? 'text-brand bg-brand-light' : 'text-body hover:text-heading hover:bg-surface-hover'
            )}
          >
            {group.label}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', openId === group.id && 'rotate-180')} />
          </button>
          {openId === group.id && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-surface rounded-2xl shadow-xl border border-edge/60 py-2 z-50">
              {group.links.map(link => (
                <Link
                  key={link.href}
                  href={`/${locale}${link.href}`}
                  onClick={() => setOpenId(null)}
                  className="block px-4 py-2.5 hover:bg-surface-hover transition-colors"
                >
                  <span className="text-sm font-semibold text-heading">{link.label}</span>
                  {link.description && (
                    <span className="block text-xs text-hint mt-0.5">{link.description}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
