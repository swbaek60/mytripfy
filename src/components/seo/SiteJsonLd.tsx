import { LOGO_SVG_PRIMARY } from '@/lib/brand/logoAssets'
import { routing } from '@/i18n/routing'
import { SITE_URL, absoluteLocaleUrl, ogImageAbsoluteUrl } from '@/lib/seo/site'
import { TOTAL_CHALLENGES } from '@/data/challengeTotals'

type Props = { locale: string }

/**
 * Organization + WebSite + WebApplication(JSON-LD) — Google·AI 검색 신호
 */
export default function SiteJsonLd({ locale }: Props) {
  const inLanguage = [...routing.locales]
  const searchTarget = `${absoluteLocaleUrl(locale, '/companions')}?q={search_term_string}`
  const homeUrl = absoluteLocaleUrl(locale, '')

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'mytripfy',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}${LOGO_SVG_PRIMARY}`,
      },
      description:
        'Free global travel community platform for finding companions, local guides, and completing travel challenges.',
      sameAs: [
        'https://twitter.com/mytripfy',
        'https://www.instagram.com/mytripfy',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@mytripfy.com',
        availableLanguage: inLanguage,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'mytripfy',
      url: homeUrl,
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
      url: homeUrl,
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description: `Find travel companions and local guides worldwide. Free community travel platform with ${TOTAL_CHALLENGES.toLocaleString('en-US')}+ travel challenges.`,
      featureList: [
        'Travel companion matching',
        'Local guide marketplace',
        '100 Countries Challenge',
        'Hall of Fame leaderboard',
        'Mutual reviews and trust scores',
      ],
      image: ogImageAbsoluteUrl(),
    },
    {
      '@type': 'TravelAgency',
      '@id': `${SITE_URL}/#travel-service`,
      name: 'mytripfy',
      url: homeUrl,
      description: 'Community-driven travel companion and local guide platform — not a traditional booking agency.',
      areaServed: { '@type': 'Place', name: 'Worldwide' },
      priceRange: 'Free',
      parentOrganization: { '@id': `${SITE_URL}/#organization` },
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
