import Link from 'next/link'
import Logo from '@/components/Logo'
import { getTranslations } from 'next-intl/server'
import HeaderNav from '@/components/HeaderNav'
import type { MegaMenuGroup, NavPrimaryLink } from '@/components/explore/ExploreMegaMenu'

/**
 * SSR: 번역·메뉴만. 배지·프로필은 HeaderNav 클라이언트 fetch (Origin Transfer 절감)
 *
 * 활성 메뉴 표시는 하위 클라이언트 컴포넌트가 usePathname 으로 직접 판단한다.
 * 따로 현재 경로를 내려주지 않는다.
 */
export default async function Header({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'Nav' })
  const tm = await getTranslations({ locale, namespace: 'Marketing' })

  const PRIMARY_NAV_LINKS: NavPrimaryLink[] = [
    { href: '/companions', label: t('findCompanions'), description: tm('navExploreCompanionsDesc') },
    { href: '/guides', label: t('findGuides'), description: tm('navExploreGuidesDesc') },
  ]

  const MEGA_MENU_GROUPS: MegaMenuGroup[] = [
    {
      id: 'discover',
      label: tm('navDiscover'),
      links: [
        { href: '/destinations', label: tm('navDestinations'), description: tm('navExploreDestinationsDesc') },
        { href: '/sponsors', label: t('sponsors'), description: tm('navExploreSponsorsDesc') },
      ],
    },
    {
      id: 'play',
      label: tm('navPlay'),
      links: [
        { href: '/challenges', label: t('challenges'), description: tm('navPlayChallengesDesc') },
        { href: '/challenges/feed', label: tm('navCertFeed'), description: tm('navPlayFeedDesc') },
        { href: '/hall-of-fame', label: t('hallOfFame'), description: tm('navPlayHallDesc') },
      ],
    },
    {
      id: 'community',
      label: tm('navCommunity'),
      links: [
        { href: '/how-it-works', label: tm('navHowItWorks'), description: tm('navCommunityHowDesc') },
        { href: '/blog', label: tm('navBlog'), description: tm('navCommunityBlogDesc') },
        { href: '/personality', label: tm('navTripMatcher'), description: tm('navCommunityQuizDesc') },
      ],
    },
    {
      id: 'host',
      label: tm('navHost'),
      links: [
        { href: '/profile/edit', label: tm('navBecomeGuide'), description: tm('navHostGuideDesc') },
        { href: '/sponsors/new', label: tm('navListBusiness'), description: tm('navHostBusinessDesc') },
      ],
    },
  ]

  const logoSlot = (
    <Link
      href={`/${locale}`}
      className="shrink-0 flex items-center justify-start h-9 min-[380px]:h-10 md:h-auto md:mr-2 w-auto min-w-0 py-0.5 md:py-0"
    >
      <Logo
        className="!h-[1.152rem] min-[380px]:!h-[1.28rem] sm:!h-[1.408rem] md:!h-[1.434rem] lg:!h-[1.638rem] max-w-full"
        priority
      />
    </Link>
  )

  return (
    <header className="w-full sticky top-0 z-50 pt-[env(safe-area-inset-top)] bg-white border-b border-edge/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeaderNav
          logoSlot={logoSlot}
          locale={locale}
          primaryNavLinks={PRIMARY_NAV_LINKS}
          megaMenuGroups={MEGA_MENU_GROUPS}
          tDashboard={t('dashboard')}
          tProfile={t('profile')}
          tLogout={t('logout')}
          tLogin={t('login')}
          tBookmarks={tm('navSaved')}
          tMessages={t('messages')}
          tMenu={t('menu')}
          tAccount={tm('footerAccount')}
          tMobileMore={tm('navMobileMore')}
          tLanguage={t('language')}
          tCurrency={t('currency')}
        />
      </div>
    </header>
  )
}
