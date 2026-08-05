import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import { Link } from '@/i18n/routing'

/**
 * 로케일 세그먼트의 404.
 *
 * 여러 상세 페이지가 notFound() 를 호출하는데, 이 파일이 없으면 사이트 톤과
 * 다른 Next.js 기본 화면이 뜨고 사용자가 갈 곳이 없다.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations('Marketing')
  const tErr = await getTranslations('Errors')

  const links = [
    { href: '/companions', label: t('footerCompanions') },
    { href: '/guides', label: t('footerGuides') },
    { href: '/challenges', label: t('footerChallenges') },
    { href: '/destinations', label: t('navDestinations') },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-sunken px-4 py-16">
      <Link href="/" className="mb-8">
        <Logo className="h-10 sm:h-11" priority />
      </Link>
      <p className="text-6xl font-extrabold text-brand/20 mb-2">404</p>
      <h1 className="text-xl font-bold text-heading mb-2">{tErr('pageNotFound')}</h1>
      <p className="text-body text-center max-w-sm mb-8">{tErr('notFoundBody')}</p>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-edge bg-surface px-4 py-2 text-sm font-medium text-body transition-colors hover:border-edge-brand hover:text-brand"
          >
            {l.label}
          </Link>
        ))}
      </div>
      <Button asChild className="rounded-full bg-brand hover:bg-brand-hover">
        <Link href="/">{tErr('goHome')}</Link>
      </Button>
    </div>
  )
}
