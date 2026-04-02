import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/site'

/**
 * 전 세계 검색엔진·AI 크롤러: 공개 콘텐츠 수집 허용, 비공개·API·인증 경로 차단
 * (노출 목적이면 GPTBot 등 학습 봇도 막지 않음 — 별도 정책 시 rules 분리)
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    '/api/',
    '/sign-in',
    '/sign-up',
    '/sso-callback',
    '/auth/',
    '/*/dashboard',
    '/*/profile',
    '/*/profile/',
    '/*/messages',
    '/*/messages/',
    '/*/notifications',
    '/*/bookmarks',
    '/*/login',
    '/*/reviews/mine',
    '/*/reviews/write',
    '/*/companions/new',
    '/*/companions/*/edit',
    '/*/trips/new',
    '/*/trips/*/edit',
    '/*/guides/requests/new',
    '/*/guides/requests/*/edit',
    '/*/sponsors/new',
    '/*/sponsors/*/edit',
    '/*/sponsors/mine',
    '/*/personality',
    '/*/challenges/disputes/',
    '/*/users/',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//, ''),
  }
}
