import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { SITE_URL } from '@/lib/seo/site'

/** 파비콘은 src/app/favicon.ico·icon.png·apple-icon.png (npm run icons 로 생성) */
export const metadata: Metadata = {
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1D4ED8',
  viewportFit: 'cover',
}

// 가로 스크롤 방지 (WebView 앱 환경 대응)
// html에 overflow-x: hidden 적용 시 position: fixed 요소 클리핑 발생 → body에만 적용
const noHorizontalScrollStyle = `
  body {
    overflow-x: clip;
    max-width: 100%;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`

export default function RootLayout({ children }: { children: ReactNode }) {
  // <html> 은 루트 레이아웃만 그릴 수 있고 여기엔 [locale] 세그먼트가 없다. 로케일을
  // 서버에서 읽으려면 헤더를 봐야 하는데, 그러면 하위 페이지 전체가 동적 렌더링으로
  // 떨어진다(사전렌더 978개 → 0개). next/root-params 도 루트 레이아웃 위의 세그먼트만
  // 주기 때문에 지금 구조에서는 쓸 수 없다. 그래서 문서 기본값은 영어로 두고, 실제 언어와
  // 방향은 [locale]/layout 이 LocaleDocumentAttrs 로 첫 페인트 전에 바로잡는다.
  // 화면 방향은 [locale]/layout 의 래퍼 div 가 dir 로 서버에서 이미 정한다.
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className="scroll-smooth">
      <head>
        <style>{`nextjs-portal { display: none !important; }`}</style>
        <style>{noHorizontalScrollStyle}</style>
      </head>
      <body suppressHydrationWarning className="min-h-screen antialiased">
        <ClerkProvider
          appearance={{
            variables: { colorPrimary: '#1D4ED8' },
          }}
          signInFallbackRedirectUrl={SITE_URL}
          signUpFallbackRedirectUrl={SITE_URL}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
