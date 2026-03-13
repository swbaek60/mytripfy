import type { ReactNode } from 'react'
import type { Viewport } from 'next'

/**
 * Next.js App Router requires a root layout with <html> and <body>.
 * Locale-specific markup (lang, fonts, etc.) is in app/[locale]/layout.tsx.
 */

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e40af',
  viewportFit: 'cover', /* 노치·홈 인디케이터 기기에서 세이프 영역 사용 */
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body suppressHydrationWarning className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
