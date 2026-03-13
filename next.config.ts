import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
 
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
 
const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: '/logo.png' },
      { pathname: '/logo-transparent.png' },
    ],
  },
};
 
export default withNextIntl(nextConfig);