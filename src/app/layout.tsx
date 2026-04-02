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
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
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
