import { routing } from '@/i18n/routing'
import { SITE_URL, absoluteLocaleUrl, ogImageAbsoluteUrl } from '@/lib/seo/site'

type Props = { locale: string }

/**
 * Organization + WebSite(JSON-LD) — Google 검색결과·AI 요약·지식 패널 신호 강화
 */
export default function SiteJsonLd({ locale }: Props) {
  const inLanguage = [...routing.locales]
  const searchTarget = `${absoluteLocaleUrl(locale, '/companions')}?q={search_term_string}`

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'mytripfy',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo-transparent.png`,
      },
      sameAs: ['https://twitter.com/mytripfy'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'mytripfy',
      url: absoluteLocaleUrl(locale, ''),
      inLanguage,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: searchTarget,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#webapp`,
      name: 'mytripfy',
      url: absoluteLocaleUrl(locale, ''),
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Find travel companions and local guides worldwide. Free community travel platform.',
      image: ogImageAbsoluteUrl(),
    },
  ]

  const json = {
    '@context': 'https://schema.org',
    '@graph': graph,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  )
}
