'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { buildInviteUrl } from '@/lib/referral'

export default function ReferralShare({
  locale,
  code,
  referralCount = 0,
}: {
  locale: string
  code: string
  referralCount?: number
}) {
  const tm = useTranslations('Marketing')
  const [copied, setCopied] = useState(false)
  const url = buildInviteUrl(locale, code)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-light/40 p-5">
      <h3 className="font-bold text-heading mb-1">{tm('referralHeading')}</h3>
      <p className="text-sm text-subtle mb-3">{tm('referralSubtitle', { count: referralCount })}</p>
      <p className="text-xs break-all text-heading/80 mb-3 font-mono bg-white/60 rounded-lg px-3 py-2">{url}</p>
      <Button type="button" onClick={copy} className="rounded-full bg-brand hover:bg-brand-hover">
        {copied ? tm('referralCopied') : tm('referralCopy')}
      </Button>
    </div>
  )
}
