'use client'

import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AffiliateLink } from '@/lib/affiliate'

export default function ChallengeAffiliateCTA({ links }: { links: AffiliateLink[] }) {
  const tc = useTranslations('Challenges')
  if (links.length === 0) return null

  return (
    <div className="mt-4 rounded-xl border border-edge bg-surface-sunken p-4 text-left">
      <p className="text-xs font-bold text-subtle uppercase tracking-wider mb-3">{tc('affiliateTitle')}</p>
      <div className="flex flex-col gap-2">
        {links.map(link => (
          <a
            key={link.provider}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-between gap-2 rounded-lg border border-edge bg-surface px-3 py-2.5 text-sm font-medium text-brand hover:bg-brand-light transition-colors"
          >
            <span>{tc(link.labelKey)}</span>
            <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
          </a>
        ))}
      </div>
      <p className="text-[10px] text-hint mt-2">{tc('affiliateDisclaimer')}</p>
    </div>
  )
}
