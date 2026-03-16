import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | mytripfy',
  description: 'Privacy Policy for mytripfy - how we collect, use and protect your personal information.',
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations({ locale, namespace: 'Privacy' })

  const sections = [
    {
      title: t('s1Title'),
      body: t('s1Body'),
    },
    {
      title: t('s2Title'),
      body: t('s2Body'),
    },
    {
      title: t('s3Title'),
      body: t('s3Body'),
    },
    {
      title: t('s4Title'),
      body: t('s4Body'),
    },
    {
      title: t('s5Title'),
      body: t('s5Body'),
    },
    {
      title: t('s6Title'),
      body: t('s6Body'),
    },
    {
      title: t('s7Title'),
      body: t('s7Body'),
    },
    {
      title: t('s8Title'),
      body: t('s8Body'),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Page header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">{t('pageTitle')}</h1>
          <p className="text-sm text-gray-500">{t('effectiveDate')}</p>
        </div>

        {/* Intro */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 sm:p-6 mb-8 text-sm text-blue-800 leading-relaxed">
          {t('intro')}
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                {section.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.body}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 bg-gray-100 rounded-2xl p-5 sm:p-6 text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800 mb-1">{t('contactTitle')}</p>
          <p>{t('contactBody')}</p>
          <a href="mailto:support@mytripfy.com" className="inline-block mt-2 text-blue-600 hover:underline font-medium">
            support@mytripfy.com
          </a>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <Link href={`/${locale}`} className="text-sm text-blue-600 hover:underline">
            ← {t('backHome')}
          </Link>
        </div>
      </main>
    </div>
  )
}
