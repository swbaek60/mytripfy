import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        destination: '/api/assetlinks',
      },
    ];
  },
  images: {
    localPatterns: [
      { pathname: '/logo.png' },
      { pathname: '/logo-transparent.png' },
      { pathname: '/mytripfy-logo.png' },
      { pathname: '/og-image.png' },
    ],
    remotePatterns: [
      // Clerk 사용자 프로필 이미지 (Google, Facebook OAuth 등)
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '*.clerk.accounts.dev' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
    ],
  },
};

export default withNextIntl(nextConfig);
