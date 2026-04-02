import Header from '@/components/Header'
import Link from 'next/link'
import { createClient, getAuthUser } from '@/utils/supabase/server'
import { getDisputeLabels } from '@/data/dispute-labels'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SeoPages' })
  return buildPageMetadata({
    locale,
    path: '/challenges/guide',
    title: t('challengesGuideTitle'),
    description: t('challengesGuideDesc'),
    keywords: ['how travel challenges work', 'mytripfy guide', 'challenge rules'],
  })
}

export default async function ChallengeGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const L = getDisputeLabels(locale)
  const t = await getTranslations({ locale, namespace: 'ChallengeGuide' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} currentPath="/challenges" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── 히어로 ─────────────────────────────────────── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-danger-light border border-red-200 text-danger text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            🚩 {L.systemName}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-heading leading-tight">
            {L.guide.heroTitle.includes('\n')
              ? L.guide.heroTitle.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)
              : L.guide.heroTitle}
          </h1>
          <p className="mt-4 text-subtle text-base leading-relaxed max-w-xl mx-auto">
            {L.guide.heroSub}
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link href={`/${locale}/challenges/feed`}>
              <button className="bg-purple text-white font-bold px-6 py-2.5 rounded-full text-sm hover:brightness-95 transition-colors">
                {t('communityFeedCta')}
              </button>
            </Link>
            <Link href={`/${locale}/challenges`}>
              <button className="bg-surface border border-edge text-body font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-surface-hover transition-colors">
                {t('challengeHubBtn')}
              </button>
            </Link>
          </div>
        </div>

        {/* ── 전체 흐름 4단계 ────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-heading mb-6 text-center">{L.guide.howItWorksTitle}</h2>
          <div className="relative">
            {/* 연결선 */}
            <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-light to-red-200 hidden sm:block" />
            <div className="space-y-4">
              {[
                { step: '01', icon: '🔍', color: 'bg-purple-light border-purple-light', badge: 'text-purple bg-purple-light', titleKey: 'step1Title' as const, descKey: 'step1Desc' as const },
                { step: '02', icon: '🚩', color: 'bg-gold-light border-gold/30', badge: 'text-gold bg-gold-light', titleKey: 'step2Title' as const, descKey: 'step2Desc' as const },
                { step: '03', icon: '⚖️', color: 'bg-brand-light border-edge-brand', badge: 'text-brand bg-brand-muted', titleKey: 'step3Title' as const, descKey: 'step3Desc' as const },
                { step: '04', icon: '🏛️', color: 'bg-success-light border-green-200', badge: 'text-success bg-success-light', titleKey: 'step4Title' as const, descKey: 'step4Desc' as const },
              ].map((item, i) => (
                <div key={i} className={`relative flex gap-4 sm:gap-6 p-5 rounded-2xl border-2 ${item.color}`}>
                  <div className="flex-shrink-0 w-16 h-16 bg-surface rounded-2xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-2xl">{item.icon}</span>
                    <span className={`text-[10px] font-black mt-0.5 px-1 rounded ${item.badge}`}>{item.step}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-heading text-base mb-1">{t(item.titleKey)}</h3>
                    <p className="text-sm text-body leading-relaxed">{t(item.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 포인트 정산 표 ─────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-heading mb-6 text-center">{L.guide.pointTableTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Scenario A: dispute upheld */}
            <div className="bg-surface rounded-2xl border-2 border-red-200 overflow-hidden">
              <div className="bg-danger text-white px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{t('scenarioALabel')}</p>
                <p className="text-lg font-extrabold">{t('scenarioATitle')}</p>
                <p className="text-sm opacity-80">{t('scenarioASub')}</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { who: t('scenarioA_certifier'), change: t('scenarioA_certifierChange'), color: 'text-danger', bg: 'bg-danger-light' },
                  { who: t('scenarioA_reporter'), change: t('scenarioA_reporterChange'), color: 'text-success', bg: 'bg-success-light' },
                  { who: t('scenarioA_jury'), change: t('scenarioA_juryChange'), color: 'text-brand', bg: 'bg-brand-light' },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center px-3 py-2.5 rounded-xl ${row.bg}`}>
                    <span className="text-sm font-semibold text-body">{row.who}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenario B: dispute dismissed */}
            <div className="bg-surface rounded-2xl border-2 border-green-200 overflow-hidden">
              <div className="bg-success text-white px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{t('scenarioBLabel')}</p>
                <p className="text-lg font-extrabold">{t('scenarioBTitle')}</p>
                <p className="text-sm opacity-80">{t('scenarioBSub')}</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { who: t('scenarioB_certifier'), change: t('scenarioB_certifierChange'), color: 'text-success', bg: 'bg-success-light' },
                  { who: t('scenarioB_reporter'), change: t('scenarioB_reporterChange'), color: 'text-danger', bg: 'bg-danger-light' },
                  { who: t('scenarioB_jury'), change: t('scenarioB_juryChange'), color: 'text-brand', bg: 'bg-brand-light' },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center px-3 py-2.5 rounded-xl ${row.bg}`}>
                    <span className="text-sm font-semibold text-body">{row.who}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 반복 위반 ─────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-heading mb-4 text-center">{L.guide.repeatPenaltyTitle}</h2>
          <div className="bg-surface rounded-2xl border border-edge overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-sunken border-b border-edge">
                  <th className="text-left px-5 py-3 font-bold text-body">{t('penaltyHeaderCount')}</th>
                  <th className="text-left px-5 py-3 font-bold text-body">{t('penaltyHeaderPenalty')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {[
                  { countKey: 'penalty1Count' as const, penaltyKey: 'penalty1Text' as const, severity: 'text-gold' },
                  { countKey: 'penalty2Count' as const, penaltyKey: 'penalty2Text' as const, severity: 'text-gold font-semibold' },
                  { countKey: 'penalty3Count' as const, penaltyKey: 'penalty3Text' as const, severity: 'text-danger' },
                  { countKey: 'penalty4Count' as const, penaltyKey: 'penalty4Text' as const, severity: 'text-danger font-bold' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-surface-hover">
                    <td className="px-5 py-3.5 font-semibold text-heading">{t(row.countKey)}</td>
                    <td className={`px-5 py-3.5 ${row.severity}`}>{t(row.penaltyKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 자격 조건 ─────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-heading mb-4 text-center">{L.guide.eligibilityTitle}</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: '🏅', titleKey: 'elig1Title' as const, descKey: 'elig1Desc' as const },
              { icon: '⏰', titleKey: 'elig2Title' as const, descKey: 'elig2Desc' as const },
              { icon: '🔁', titleKey: 'elig3Title' as const, descKey: 'elig3Desc' as const },
            ].map((item, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-edge p-5 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-bold text-heading text-sm mb-1">{t(item.titleKey)}</p>
                <p className="text-xs text-subtle leading-relaxed">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-heading mb-4 text-center">{L.guide.faqTitle}</h2>
          <div className="space-y-3">
            {[
              { qKey: 'faq1Q' as const, aKey: 'faq1A' as const },
              { qKey: 'faq2Q' as const, aKey: 'faq2A' as const },
              { qKey: 'faq3Q' as const, aKey: 'faq3A' as const },
              { qKey: 'faq4Q' as const, aKey: 'faq4A' as const },
              { qKey: 'faq5Q' as const, aKey: 'faq5A' as const },
            ].map((item, i) => (
              <details key={i} className="bg-surface border border-edge rounded-2xl group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none">
                  <span className="font-semibold text-heading text-sm pr-4">{t(item.qKey)}</span>
                  <span className="text-hint group-open:rotate-180 transition-transform shrink-0">▾</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-body leading-relaxed border-t border-edge pt-3">
                  {t(item.aKey)}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-purple to-indigo rounded-2xl p-8 text-white text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <h2 className="text-2xl font-extrabold mb-2">{L.guide.ctaTitle}</h2>
          <p className="text-white/80 mb-6 text-sm leading-relaxed">
            {L.guide.ctaSub}
          </p>
          <Link href={`/${locale}/challenges/feed`}>
            <button className="bg-surface text-purple font-bold px-8 py-3 rounded-full hover:bg-purple-light transition-colors">
              {t('communityFeedCta')}
            </button>
          </Link>
        </div>

      </main>
    </div>
  )
}
