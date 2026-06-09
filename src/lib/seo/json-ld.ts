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
