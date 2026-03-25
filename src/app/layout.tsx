import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e40af',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body suppressHydrationWarning className="min-h-screen antialiased">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
