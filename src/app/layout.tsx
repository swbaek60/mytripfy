import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1D4ED8',
  viewportFit: 'cover',
}

// 가로 스크롤 방지 (WebView 앱 환경 대응)
const noHorizontalScrollStyle = `
  html, body {
    overflow-x: hidden;
    max-width: 100vw;
  }
  * {
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
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
