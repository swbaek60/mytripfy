import { createClient } from '@/utils/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import { getDisputeLabels } from '@/data/dispute-labels'
import { getTranslations } from 'next-intl/server'
import { Siren } from 'lucide-react'

const CATEGORIES = [
  { key: 'countries',     title: '100 Countries',      emoji: '🌍', desc: 'Nations to explore' },
  { key: 'restaurants',   title: '100 Restaurants',   emoji: '🍽️', desc: 'World\'s best dining' },
  { key: 'foods',         title: '100 Foods',          emoji: '🍜', desc: 'Must-eat dishes' },
  { key: 'drinks',        title: '100 Drinks',         emoji: '🍶', desc: 'Legendary beverages' },
  { key: 'attractions',   title: '100 Attractions',    emoji: '🏛️', desc: 'Iconic landmarks' },
  { key: 'museums',       title: '100 Museums',        emoji: '🏺', desc: 'Cultural treasures' },
  { key: 'art_galleries', title: '100 Art Galleries',  emoji: '🖼️', desc: 'Greatest galleries' },
  { key: 'nature',        title: '100 Nature Spots',   emoji: '🏔️', desc: 'Natural wonders' },
  { key: 'islands',       title: '100 Islands',        emoji: '🏝️', desc: 'Paradise islands' },
  { key: 'animals',       title: '100 Animals',        emoji: '🦁', desc: 'Wildlife encounters' },
  { key: 'festivals',     title: '100 Festivals',      emoji: '🎭', desc: 'Epic celebrations' },
  { key: 'golf',          title: '100 Golf Courses',   emoji: '⛳', desc: 'World\'s finest greens' },
  { key: 'fishing',       title: '100 Fishing Spots',  emoji: '🎣', desc: 'Legendary waters' },
  { key: 'surfing',       title: '100 Surf Spots',     emoji: '🏄', desc: 'Best waves' },
  { key: 'skiing',        title: '100 Ski Resorts',    emoji: '⛷️', desc: 'Greatest slopes' },
  { key: 'scuba',         title: '100 Dive Sites',     emoji: '🤿', desc: 'Underwater wonders' },
]

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const L = getDisputeLabels(locale)
  const t = await getTranslations({ locale, namespace: 'ChallengesPage' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 카테고리별 내 완료 수 조회
  let certCountByCategory: Record<string, number> = {}
  let totalCertified = 0

  if (user) {
    const { data: certs } = await supabase
      .from('challenge_certifications')
      .select('challenge_id, challenges(category)')
      .eq('user_id', user.id)

    if (certs) {
      totalCertified = certs.length
      for (const cert of certs) {
        const cat = (cert.challenges as any)?.category
        if (cat) certCountByCategory[cat] = (certCountByCategory[cat] || 0) + 1
      }
    }
  }

  const totalChallenges = CATEGORIES.length * 100  // 16 × 100 = 1600

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/challenges" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* 딴지걸기 시스템 배너 */}
        <div className="bg-amber-light border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Siren className="w-7 h-7 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-900 text-sm">{L.systemName} — {L.tagline}</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {t('spotsLeft')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Link href={`/${locale}/challenges/feed`}>
              <button className="bg-purple text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-purple-700 transition-colors">
                🌍 {t('communityFeed')}
              </button>
            </Link>
            <Link href={`/${locale}/challenges/guide`}>
              <button className="border border-amber-300 bg-surface text-amber-700 text-xs font-bold px-4 py-2 rounded-full hover:bg-amber-light transition-colors">
                📖 {L.systemName}
              </button>
            </Link>
          </div>
        </div>

        {/* 히어로 */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-extrabold mb-2">🏆 {t('world100Title')}</h1>
          <p className="text-purple-200 mb-6">
            {t('subtitle')}
          </p>

          {user ? (
            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span>{t('overallProgress')}</span>
                <span>{totalCertified} / {totalChallenges}</span>
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
                      totalCertified >= m.at ? 'bg-surface text-purple' : 'bg-white/20 text-white/60'
                    }`}>
                    {m.emoji} {m.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Link href={`/${locale}/login`}>
              <button className="bg-surface text-purple font-bold px-6 py-2.5 rounded-full text-sm hover:bg-purple-light transition-colors">
                {t('loginToTrack')}
              </button>
            </Link>
          )}
        </div>

        {/* 카테고리 그리드 */}
        <div>
          <h2 className="text-xl font-bold text-heading mb-4">{t('chooseCategory')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => {
              const done = certCountByCategory[cat.key] || 0
              const pct = Math.round((done / 100) * 100)
              return (
                <Link key={cat.key} href={`/${locale}/challenges/${cat.key}`}>
                  <div className="bg-surface rounded-2xl p-4 border-2 border-transparent hover:border-purple-300 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="text-3xl mb-2">{cat.emoji}</div>
                    <p className="font-bold text-heading text-sm leading-tight">{cat.title}</p>
                    <p className="text-xs text-hint mt-0.5 mb-3">{cat.desc}</p>
                    {user ? (
                      <>
                        <div className="w-full bg-surface-sunken rounded-full h-1.5 mb-1">
                          <div
                            className="bg-purple h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-hint">{done}/100</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-hint">100 items</p>
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
