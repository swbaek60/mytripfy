import Link from 'next/link'
import { getUnreadNotificationCount, getUnreadMessageCount } from '@/utils/notifications'
import Logo from '@/components/Logo'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/utils/supabase/server'
import HeaderNav from '@/components/HeaderNav'
import { currentUser } from '@clerk/nextjs/server'
import type { User } from '@supabase/supabase-js'

export default async function Header({
  locale,
  currentPath = '',
  user: _userProp,
}: {
  locale: string
  currentPath?: string
  user?: User | null
}) {
  const t = await getTranslations({ locale, namespace: 'Nav' })

  const NAV_LINKS = [
    { href: '/companions',   label: t('findCompanions') },
    { href: '/guides',       label: t('findGuides') },
    { href: '/sponsors',     label: t('sponsors') },
    { href: '/challenges',   label: t('challenges') },
    { href: '/hall-of-fame', label: t('hallOfFame') },
  ]

  // Clerk 현재 사용자 (오류 시 null 처리)
  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null
  try {
    clerkUser = await currentUser()
  } catch {
    // Keyless Mode 초기화 중이거나 인증 컨텍스트 없음 → 비로그인 상태로 처리
  }

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
        const [uc, umc] = await Promise.all([
          getUnreadNotificationCount(profileData.id),
          getUnreadMessageCount(profileData.id),
        ])
        unreadCount = uc
        unreadMessageCount = umc
      }
    } catch { /* DB 조회 실패 시 무시 */ }
  }

  const logoSlot = (
    <Link
      href={`/${locale}`}
      className="shrink-0 flex items-center justify-start h-12 md:h-auto md:mr-2 w-auto py-1 md:py-0"
    >
      <Logo className="h-10 sm:h-11 md:h-[2.8rem] lg:h-[3.2rem]" />
    </Link>
  )

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <HeaderNav
          logoSlot={logoSlot}
          locale={locale}
          userId={profile?.id ?? clerkUser?.id}
          userEmail={clerkUser?.emailAddresses?.[0]?.emailAddress}
          avatarUrl={profile?.avatar_url ?? clerkUser?.imageUrl}
          fullName={profile?.full_name ?? clerkUser?.fullName}
          navLinks={NAV_LINKS}
          unreadCount={unreadCount}
          unreadMessageCount={unreadMessageCount}
          tDashboard={t('dashboard')}
          tProfile={t('profile')}
          tLogout={t('logout')}
          tLogin={t('login')}
          tBookmarks={t('bookmarks')}
          tMessages={t('messages')}
          tNotifications={t('notifications')}
          tMenu={t('menu')}
          tLanguage={t('language')}
          tCurrency={t('currency')}
        />
      </div>
    </header>
  )
}
