'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Tab {
  href: string
  label: string
}

interface Props {
  tabs: Tab[]
  locale: string
}

export default function GuidesTabBar({ tabs, locale }: Props) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 p-1 bg-surface-sunken rounded-xl mb-6 w-fit max-w-full overflow-x-auto">
      {tabs.map(tab => {
        const fullHref = `/${locale}${tab.href}`
        const active = pathname === fullHref || pathname.startsWith(`${fullHref}/`)
        return (
          <Link
            key={tab.href}
            href={fullHref}
            className={cn(
              'px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors',
              active ? 'bg-surface text-heading shadow-sm' : 'text-subtle hover:text-body'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
