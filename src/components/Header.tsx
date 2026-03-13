import Link from 'next/link'
import { getUnreadNotificationCount, getUnreadMessageCount } from '@/utils/notifications'
import type { User } from '@supabase/supabase-js'
import Logo from '@/components/Logo'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import HeaderNav from '@/components/HeaderNav'

export default async function Header({
  user,
  locale,
  currentPath = '',
}: {
  user: User | null
  locale: string
  currentPath?: string
}) {
  const t = await getTranslations({ locale, namespace: 'Nav' })

  const NAV_LINKS = [
    { href: '/companions',   label: t('findCompanions') },
    { href: '/guides',       label: t('findGuides') },
    { href: '/sponsors',     label: t('sponsors') },
    { href: '/challenges',   label: t('challenges') },
    { href: '/hall-of-fame', label: t('hallOfFame') },
  ]

  // 알림 카운트 + 프로필 데이터
  const [unreadCount, unreadMessageCount, profile] = user
    ? await Promise.all([
        getUnreadNotificationCount(user.id),
        getUnreadMessageCount(user.id),
        (async () => {
          const supabase = await createClient()
          const { data } = await supabase
            .from('profiles')
            .select('avatar_url, full_name')
            .eq('id', user.id)
            .single()
          return data
        })(),
      ])
    : [0, 0, null]

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center min-h-14 h-14 gap-2 sm:gap-3">

          {/* 로고 */}
          <Link href={`/${locale}`} className="shrink-0 flex items-center mr-2">
            <Logo className="h-[2.8rem] sm:h-[3.2rem]" />
          </Link>

          {/* 네비 + 오른쪽 버튼 (HeaderNav 클라이언트 컴포넌트) */}
          <HeaderNav
            locale={locale}
            userId={user?.id}
            userEmail={user?.email}
            avatarUrl={profile?.avatar_url}
            fullName={profile?.full_name}
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
      </div>
    </header>
  )
}
