import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
import { IMAGE_REMOTE_PATTERNS } from './src/lib/image-hosts';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
    // next/root-params 는 루트 레이아웃보다 위에 있는 세그먼트만 준다. 우리 [locale] 은
    // app/layout.tsx 아래에 있어 대상이 아니다. 레이아웃 구조를 바꾸면 쓸 수 있다.
    // rootParams: true,
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        destination: '/api/assetlinks',
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    // public/ 안의 래스터 이미지는 모두 최적화를 허용한다.
    //
    // 예전에는 파일 이름을 하나씩 나열했는데, 새 이미지를 추가할 때마다 이 목록을
    // 잊어버려 런타임에 "Invalid src prop" 으로 페이지가 죽었다. 확장자로 제한하면
    // 임의 경로 최적화는 계속 막으면서 목록 관리 부담은 사라진다.
    //
    // 패턴 앞에 `/` 를 붙이면 안 된다. `/**/*.jpg` 는 하위 디렉터리만 잡고 루트의
    // `/hero.jpg` 는 놓친다. `search: ''` 로 쿼리스트링 변형은 막는다.
    // SVG 는 래스터화할 이유가 없어 의도적으로 제외한다.
    localPatterns: [
      { pathname: '**/*.png', search: '' },
      { pathname: '**/*.jpg', search: '' },
      { pathname: '**/*.jpeg', search: '' },
      { pathname: '**/*.webp', search: '' },
      { pathname: '**/*.avif', search: '' },
    ],
    remotePatterns: IMAGE_REMOTE_PATTERNS,
  },
};

export default withNextIntl(nextConfig);
