import Link from 'next/link'

/**
 * 로케일 밖에서 발생한 404 (예: /foo).
 * 여기서는 next-intl 컨텍스트가 없으므로 영문 고정 문구를 쓰고 기본 로케일로 보낸다.
 */
export default function RootNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-sunken px-4 text-center">
      <p className="text-6xl font-extrabold text-hint mb-2">404</p>
      <h1 className="text-xl font-bold text-heading mb-2">Page not found</h1>
      <p className="text-subtle max-w-sm mb-8">
        We couldn’t find that page. Let’s get you back to mytripfy.
      </p>
      <Link
        href="/en"
        className="rounded-full bg-brand-hover px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
      >
        Go home
      </Link>
    </div>
  )
}
