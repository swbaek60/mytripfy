import type { Metadata } from 'next'
import {
  SITE_URL,
  absoluteLocaleUrl,
  hreflangAlternates,
  ogImageAbsoluteUrl,
  ogLocaleFor,
} from './site'

type BuildPageMetadataOptions = {
  locale: string
  /** 로케일 제외 경로: '', '/companions', '/guides/abc' */
  path: string
  title: string
  description: string
  keywords?: string[]
  openGraphType?: 'website' | 'article'
  /** 로그인 전용 등 */
  noindex?: boolean
}

/**
 * 검색·SNS·AI 인용에 쓰이는 canonical / hreflang / OG / Twitter 일괄 구성
 */
export function buildPageMetadata(opts: BuildPageMetadataOptions): Metadata {
  const {
    locale,
    path,
    title,
    description,
    keywords,
    openGraphType = 'website',
    noindex,
  } = opts

  const canonical = absoluteLocaleUrl(locale, path)
  const ogImage = ogImageAbsoluteUrl()

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    // noindex 에도 follow 는 남긴다. 색인은 막되 이 페이지에 걸린 링크는 따라가게 해야
    // 거기서 이어지는 공개 페이지가 발견된다. nofollow 까지 걸면 그 경로가 끊긴다.
    robots: noindex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    alternates: {
      canonical,
      // 색인하지 않는 페이지에 hreflang 을 달면 검색엔진에 "이 언어판을 대신 보라"고
      // 알려 주는 셈이 된다. noindex 와 모순이라 언어 대체 링크는 빼 둔다.
      ...(noindex ? {} : { languages: hreflangAlternates(path) }),
    },
    openGraph: {
      type: openGraphType,
      locale: ogLocaleFor(locale),
      url: canonical,
      siteName: 'mytripfy',
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} – mytripfy`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@mytripfy',
      site: '@mytripfy',
    },
  }
}

/** 레이아웃용: metadataBase + 절대 URL이 필요한 필드 */
export function rootMetadataBase(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
  }
}
