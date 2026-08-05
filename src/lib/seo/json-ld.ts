import { SITE_URL, absoluteLocaleUrl } from './site'

export function jsonLdScriptProps(data: Record<string, unknown>) {
  return {
    type: 'application/ld+json' as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  }
}

export function organizationRef() {
  return { '@id': `${SITE_URL}/#organization` }
}

export function buildFaqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function buildArticleJsonLd(opts: {
  locale: string
  path: string
  headline: string
  description: string
  datePublished: string
  dateModified?: string
}) {
  const url = absoluteLocaleUrl(opts.locale, opts.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    inLanguage: opts.locale,
    author: organizationRef(),
    publisher: organizationRef(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: `${SITE_URL}/og-image.png`,
  }
}

export function buildBreadcrumbJsonLd(
  locale: string,
  crumbs: { name: string; path: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteLocaleUrl(locale, crumb.path),
    })),
  }
}

/**
 * 가이드 프로필. 사람이 제공하는 서비스이므로 Person 에 지역·언어를 붙인다.
 * 리뷰 수가 0이면 aggregateRating 을 넣지 않는다. 값이 없는 별점은 구글이 무효 처리한다.
 */
export function buildGuidePersonJsonLd(opts: {
  locale: string
  guideId: string
  name: string
  description?: string | null
  image?: string | null
  areaServed?: string[]
  languages?: string[]
  reviewCount?: number
  ratingValue?: number
}) {
  const url = absoluteLocaleUrl(opts.locale, `/guides/${opts.guideId}`)
  const hasRating = !!opts.reviewCount && opts.reviewCount > 0 && !!opts.ratingValue
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    name: opts.name,
    url,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    jobTitle: 'Local Guide',
    ...(opts.areaServed?.length ? { areaServed: opts.areaServed } : {}),
    ...(opts.languages?.length ? { knowsLanguage: opts.languages } : {}),
    ...(hasRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: opts.ratingValue,
            reviewCount: opts.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    worksFor: organizationRef(),
  }
}

/**
 * 동행 모집글. 날짜와 장소가 정해진 모임이라 Event 가 가장 가깝다.
 * eventStatus·eventAttendanceMode 는 구글이 Event 리치 결과에서 요구한다.
 */
export function buildCompanionEventJsonLd(opts: {
  locale: string
  postId: string
  name: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  locationName?: string | null
  countryCode?: string | null
  image?: string | null
  organizerName?: string | null
  isOpen: boolean
}) {
  const url = absoluteLocaleUrl(opts.locale, `/companions/${opts.postId}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${url}#event`,
    name: opts.name,
    url,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.startDate ? { startDate: opts.startDate } : {}),
    ...(opts.endDate ? { endDate: opts.endDate } : {}),
    eventStatus: opts.isOpen
      ? 'https://schema.org/EventScheduled'
      : 'https://schema.org/EventCancelled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(opts.locationName || opts.countryCode
      ? {
          location: {
            '@type': 'Place',
            name: opts.locationName ?? opts.countryCode,
            address: {
              '@type': 'PostalAddress',
              ...(opts.locationName ? { addressLocality: opts.locationName } : {}),
              ...(opts.countryCode ? { addressCountry: opts.countryCode } : {}),
            },
          },
        }
      : {}),
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.organizerName
      ? { organizer: { '@type': 'Person', name: opts.organizerName } }
      : {}),
    inLanguage: opts.locale,
  }
}

/** 후원 가맹점. 주소가 있는 실제 점포이므로 LocalBusiness. */
export function buildLocalBusinessJsonLd(opts: {
  locale: string
  sponsorId: string
  name: string
  description?: string | null
  image?: string | null
  city?: string | null
  region?: string | null
  countryCode?: string | null
  address?: string | null
  website?: string | null
}) {
  const url = absoluteLocaleUrl(opts.locale, `/sponsors/${opts.sponsorId}`)
  const hasAddress = !!(opts.address || opts.city || opts.region || opts.countryCode)
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${url}#business`,
    name: opts.name,
    url,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.website ? { sameAs: [opts.website] } : {}),
    ...(hasAddress
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(opts.address ? { streetAddress: opts.address } : {}),
            ...(opts.city ? { addressLocality: opts.city } : {}),
            ...(opts.region ? { addressRegion: opts.region } : {}),
            ...(opts.countryCode ? { addressCountry: opts.countryCode } : {}),
          },
        }
      : {}),
  }
}

/** 공개 여행 일정. 일정표는 문서에 가까워 Article 로 싣는다. */
export function buildTripJsonLd(opts: {
  locale: string
  tripId: string
  name: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  countryCode?: string | null
}) {
  const url = absoluteLocaleUrl(opts.locale, `/trips/${opts.tripId}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Trip',
    '@id': `${url}#trip`,
    name: opts.name,
    url,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.startDate ? { departureTime: opts.startDate } : {}),
    ...(opts.endDate ? { arrivalTime: opts.endDate } : {}),
    ...(opts.countryCode
      ? {
          itinerary: {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressCountry: opts.countryCode },
          },
        }
      : {}),
    inLanguage: opts.locale,
    provider: organizationRef(),
  }
}

export function buildItemListJsonLd(
  locale: string,
  name: string,
  items: { name: string; path: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteLocaleUrl(locale, item.path),
    })),
  }
}
