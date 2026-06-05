import Link from 'next/link'
import { getHeaderBadgeCounts } from '@/utils/notifications'
import Logo from '@/components/Logo'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/utils/supabase/server'
import HeaderNav from '@/components/HeaderNav'
import { currentUser } from '@clerk/nextjs/server'
import type { MegaMenuGroup, NavPrimaryLink } from '@/components/explore/ExploreMegaMenu'

export default async function Header({
  locale,
  currentPath = '',
  user: _userProp,
}: {
  locale: string
  currentPath?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: { id?: string; email?: string } | null | any
}) {
  const t = await getTranslations({ locale, namespace: 'Nav' })
  const tm = await getTranslations({ locale, namespace: 'Marketing' })

  // Clerk 현재 사용자 (오류 시 null 처리)
  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null
  try {
    clerkUser = await currentUser()
  } catch {
    // Keyless Mode 초기화 중이거나 인증 컨텍스트 없음 → 비로그인 상태로 처리
  }

  const isLoggedIn = !!clerkUser
  const authHref = (path: string) => {
    if (isLoggedIn) return path
    return `/login?returnTo=${encodeURIComponent(`/${locale}${path}`)}`
  }

  const PRIMARY_NAV_LINKS: NavPrimaryLink[] = [
    { href: '/companions', label: t('findCompanions') },
    { href: '/guides', label: t('findGuides') },
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
        { href: '/personality', label: tm('navTripMatcher'), description: tm('navCommunityQuizDesc') },
      ],
    },
    {
      id: 'host',
      label: tm('navHost'),
      links: [
        { href: authHref('/profile/edit'), label: tm('navBecomeGuide'), description: tm('navHostGuideDesc') },
        { href: authHref('/sponsors/new'), label: tm('navListBusiness'), description: tm('navHostBusinessDesc') },
      ],
    },
  ]

  let unreadCount = 0
  let unreadMessageCount = 0
  let profile: { id: string; avatar_url: string | null; full_name: string | null } | null = null

  if (clerkUser) {
    try {
      const admin = createAdminClient()
      const { data: profileData } = await admin
        .from('profiles')
        .select('id, avatar_url, full_name')
        .eq('clerk_id', clerkUser.id)
        .single()

      if (profileData) {
        profile = profileData
        const { unreadNotifications, unreadMessages } = await getHeaderBadgeCounts(
          admin,
          profileData.id
        )
        unreadCount = unreadNotifications
        unreadMessageCount = unreadMessages
      }
    } catch { /* DB 조회 실패 시 무시 */ }
  }

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
          userId={clerkUser?.id}
          profileId={profile?.id}
          userEmail={clerkUser?.emailAddresses?.[0]?.emailAddress}
          avatarUrl={profile?.avatar_url ?? clerkUser?.imageUrl}
          fullName={profile?.full_name ?? clerkUser?.fullName}
          primaryNavLinks={PRIMARY_NAV_LINKS}
          megaMenuGroups={MEGA_MENU_GROUPS}
          unreadCount={unreadCount}
          unreadMessageCount={unreadMessageCount}
          tDashboard={t('dashboard')}
          tProfile={t('profile')}
          tLogout={t('logout')}
          tLogin={t('login')}
          tBookmarks={tm('navSaved')}
          tMessages={t('messages')}
          tNotifications={t('notifications')}
          tMenu={t('menu')}
          tAccount={tm('footerAccount')}
          tLanguage={t('language')}
          tCurrency={t('currency')}
        />
      </div>
    </header>
  )
}
