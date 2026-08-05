'use client'

import { useEffect } from 'react'

/**
 * 루트 레이아웃까지 깨진 경우의 마지막 방어선.
 * 이 컴포넌트는 layout 을 대체하므로 html/body 를 직접 렌더링해야 한다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error?.message, error?.digest)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#fafafa',
          color: '#171717',
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ color: '#525252', maxWidth: '24rem' }}>
          mytripfy hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          onClick={() => reset()}
          style={{
            borderRadius: '9999px',
            background: '#1D4ED8',
            color: '#fff',
            border: 'none',
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
