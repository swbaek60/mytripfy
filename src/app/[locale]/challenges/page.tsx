import { createClient, getAuthUser } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import { getDisputeLabels } from '@/data/dispute-labels'
import { getTranslations } from 'next-intl/server'
import { Siren } from 'lucide-react'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { relationOne } from '@/lib/db/relation'
import { TOTAL_CHALLENGES } from '@/data/challengeTotals'
import { CHALLENGE_CATEGORY_KEYS, CHALLENGE_CATEGORY_META } from '@/data/challenge-category-meta'
import { Button } from '@/components/ui/button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SeoPages' })
  return buildPageMetadata({
    locale,
    path: '/challenges',
    title: t('challengesTitle'),
    description: t('challengesDesc'),
    keywords: ['travel challenges', 'bucket list travel', 'mytripfy'],
  })
}

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const L = getDisputeLabels(locale)
  const t = await getTranslations({ locale, namespace: 'ChallengesPage' })
  const tc = await getTranslations({ locale, namespace: 'Challenges' })
  const tm = await getTranslations({ locale, namespace: 'Marketing' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  const certCountByCategory: Record<string, number> = {}
  let totalCertified = 0

  if (user) {
    const { data: certs } = await supabase
      .from('challenge_certifications')
      .select('challenge_id, challenges(category)')
      .eq('user_id', user.id)

    if (certs) {
      totalCertified = certs.length
      for (const cert of certs) {
        const cat = relationOne<{ category: string }>(cert.challenges)?.category
        if (cat) certCountByCategory[cat] = (certCountByCategory[cat] || 0) + 1
      }
    }
  }

  const totalChallenges = TOTAL_CHALLENGES

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header locale={locale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        <div className="bg-warning-light border border-warning-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
          <div className="flex items-center gap-3">
            <Siren className="w-7 h-7 text-warning shrink-0" />
            <div>
              <p className="font-bold text-warning-strong text-sm">{L.systemName} — {L.tagline}</p>
              <p className="text-xs text-warning-strong mt-0.5">
                {t('spotsLeft')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Link href={`/${locale}/challenges/feed`}>
              <Button size="sm" className="rounded-full bg-challenge hover:bg-challenge-strong text-white text-xs font-bold">
                🌍 {t('communityFeed')}
              </Button>
            </Link>
            <Link href={`/${locale}/challenges/guide`}>
              <Button size="sm" variant="outline" className="rounded-full border-warning-border bg-surface text-warning-strong text-xs font-bold hover:bg-warning-light">
                📖 {L.systemName}
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-challenge-strong via-challenge to-challenge/90 rounded-2xl p-8 sm:p-10 text-white shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">{t('world100Title')}</h1>
          <p className="text-challenge-muted/90 mb-6 max-w-2xl">
            {t('subtitle')}
          </p>

          {user ? (
            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span>{t('overallProgress')}</span>
                <span>{tc('progressCompleted', { completed: totalCertified, total: totalChallenges })}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-surface rounded-full h-3 transition-all duration-700"
                  style={{ width: `${Math.min(100, (totalCertified / totalChallenges) * 100)}%` }}
                />
              </div>
              <div className="flex gap-3 mt-4 flex-wrap">
                {[
                  { at: 10,   emoji: '🌱', label: t('tierStarter') },
                  { at: 100,  emoji: '🥉', label: t('tierBronze') },
                  { at: 300,  emoji: '🥈', label: t('tierSilver') },
                  { at: 600,  emoji: '🥇', label: t('tierGold') },
                  { at: 1000, emoji: '💎', label: t('tierDiamond') },
                  { at: 1600, emoji: '👑', label: t('tierLegend') },
                ].map(m => (
                  <span key={m.at}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      totalCertified >= m.at ? 'bg-surface text-challenge' : 'bg-white/20 text-white/60'
                    }`}>
                    {m.emoji} {m.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/challenges`)}`}>
              <Button className="rounded-full bg-white text-challenge-strong font-bold hover:bg-challenge-light">
                {t('loginToTrack')}
              </Button>
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-heading mb-4">{t('chooseCategory')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CHALLENGE_CATEGORY_KEYS.map(key => {
              const cat = CHALLENGE_CATEGORY_META[key]
              const done = certCountByCategory[key] || 0
              const pct = Math.round((done / 100) * 100)
              return (
                <Link key={key} href={`/${locale}/challenges/${key}`}>
                  <div className="bg-surface rounded-2xl p-4 border border-edge/60 hover:border-challenge-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                    <div className="text-3xl mb-2">{cat.emoji}</div>
                    <p className="font-bold text-heading text-sm leading-tight">{tm(cat.titleKey)}</p>
                    <p className="text-xs text-hint mt-0.5 mb-3 line-clamp-2">{tm(cat.descKey)}</p>
                    {user ? (
                      <>
                        <div className="w-full bg-surface-sunken rounded-full h-1.5 mb-1">
                          <div
                            className="bg-challenge h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-hint font-medium">{done}/100</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-hint font-medium">{tc('itemsCount', { count: 100 })}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

      </main>
    </div>
  )
}
