import Link from 'next/link'
import Header from '@/components/Header'
import { createClient, getAuthUser } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'

const DELETION_EMAIL = 'swbaek60@gmail.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SeoPages' })
  return buildPageMetadata({
    locale,
    path: '/account-data-deletion',
    title: t('accountDataDeletionTitle'),
    description: t('accountDataDeletionDesc'),
    keywords: ['account deletion', 'data deletion', 'mytripfy', 'privacy', 'GDPR'],
  })
}

export default async function AccountDataDeletionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  const t = await getTranslations({ locale, namespace: 'AccountDeletion' })

  const steps = [
    { title: t('step1Title'), body: t('step1Body') },
    { title: t('step2Title'), body: t('step2Body') },
    { title: t('step3Title'), body: t('step3Body') },
    { title: t('step4Title'), body: t('step4Body') },
  ]

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading mb-2">{t('pageTitle')}</h1>
        </div>

        <div className="bg-brand-light border border-edge-brand rounded-2xl p-5 sm:p-6 mb-8 text-sm text-blue-800 leading-relaxed">
          {t('lead')}
        </div>

        <div className="space-y-6 mb-10">
          {steps.map((s, idx) => (
            <div key={idx} className="bg-surface rounded-2xl shadow-sm border border-edge p-5 sm:p-6">
              <h2 className="text-base font-bold text-heading mb-2">{s.title}</h2>
              <p className="text-sm text-body leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <a
            href={`mailto:${DELETION_EMAIL}?subject=${encodeURIComponent('Account deletion request — mytripfy')}`}
            className="inline-flex justify-center items-center rounded-xl bg-brand text-white font-semibold text-sm px-5 py-3 hover:opacity-95 transition-opacity"
          >
            {t('emailButton')}
          </a>
          <Link
            href={`/${locale}/privacy`}
            className="inline-flex justify-center items-center rounded-xl border border-edge bg-surface text-body font-medium text-sm px-5 py-3 hover:bg-surface-sunken transition-colors"
          >
            {t('privacyLink')}
          </Link>
        </div>

        <div className="mt-10 text-center">
          <Link href={`/${locale}`} className="text-sm text-brand hover:underline">
            ← {t('backHome')}
          </Link>
        </div>
      </main>
    </div>
  )
}
