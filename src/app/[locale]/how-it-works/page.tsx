import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'
import { Users, ShieldCheck, Map, Trophy } from 'lucide-react'
import SectionShell from '@/components/layout/SectionShell'
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
    path: '/how-it-works',
    title: t('howItWorksTitle') || 'How it works | mytripfy',
    description: t('howItWorksDesc') || 'Learn how mytripfy connects travelers worldwide.',
    keywords: ['how it works', 'travel companion', 'mytripfy'],
  })
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const tm = await getTranslations({ locale, namespace: 'Marketing' })

  const steps = [
    { num: '01', title: tm('howStep1'), desc: tm('howStep1Detail'), icon: Users, color: '#2563EB' },
    { num: '02', title: tm('howStep2'), desc: tm('howStep2Detail'), icon: Map, color: '#D4A853' },
    { num: '03', title: tm('howStep3'), desc: tm('howStep3Detail'), icon: ShieldCheck, color: '#0D9488' },
    { num: '04', title: tm('howStep4'), desc: tm('howStep4Detail'), icon: Trophy, color: '#7C3AED' },
  ]

  return (
    <div className="min-h-screen bg-surface-warm">
      <Header locale={locale} currentPath="/how-it-works" />

      <section className="relative bg-midnight text-white py-16 sm:py-24">
        <div className="ds-container-wide text-center">
          <h1 className="ds-hero-display text-3xl sm:text-5xl mb-4">{tm('howItWorksTitle')}</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">{tm('howItWorksSubtitle')}</p>
        </div>
      </section>

      <SectionShell variant="light">
        <div className="max-w-3xl mx-auto space-y-12">
          {steps.map(step => (
            <div key={step.num} className="flex gap-6 items-start">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${step.color}18` }}
              >
                <step.icon className="w-7 h-7" style={{ color: step.color }} />
              </div>
              <div>
                <div className="text-xs font-black tracking-widest mb-1" style={{ color: step.color }}>{step.num}</div>
                <h2 className="text-xl font-bold text-heading mb-2">{step.title}</h2>
                <p className="text-subtle leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-14">
          <Link href={`/${locale}/companions`}>
            <Button className="bg-brand hover:bg-brand-hover rounded-full px-8">{tm('howCtaBrowse')}</Button>
          </Link>
          <Link href={`/${locale}/personality`}>
            <Button variant="outline" className="rounded-full border-brand/30 text-brand hover:bg-brand-light px-8">
              {tm('howCtaQuiz')}
            </Button>
          </Link>
        </div>
      </SectionShell>
    </div>
  )
}
