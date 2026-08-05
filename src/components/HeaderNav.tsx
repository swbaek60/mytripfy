'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ExploreMegaMenu, { type MegaMenuGroup, type NavPrimaryLink } from '@/components/explore/ExploreMegaMenu'
import MobileMegaMenu from '@/components/explore/MobileMegaMenu'
import { MessageSquare, Menu, X, LogOut, User, LayoutDashboard, Bookmark, ChevronDown } from 'lucide-react'
import { useClerk, useUser } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import LanguageSelector, { LocaleTriggerButton } from '@/components/LanguageSelector'
import CurrencySelector from '@/components/CurrencySelector'
import NotificationsPanel from '@/components/NotificationsPanel'
import MessagesPanel from '@/components/MessagesPanel'
import Avatar from '@/components/ui/Avatar'

interface BadgePayload {
  profile?: { id: string; avatar_url: string | null; full_name: string | null } | null
  unreadNotifications?: number
  unreadMessages?: number
}

interface Props {
  logoSlot: React.ReactNode
  locale: string
  primaryNavLinks: NavPrimaryLink[]
  megaMenuGroups: MegaMenuGroup[]
  tDashboard: string
  tProfile: string
  tLogout: string
  tLogin: string
  tBookmarks: string
  tMessages: string
  tMenu: string
  tAccount: string
  tMobileMore: string
  tLanguage: string
  tCurrency: string
}

export default function HeaderNav({
  logoSlot,
  locale,
  primaryNavLinks,
  megaMenuGroups,
  tDashboard, tProfile, tLogout, tLogin, tBookmarks, tMessages,
  tMenu, tAccount, tMobileMore, tLanguage, tCurrency,
}: Props) {
  const tc = useTranslations('Common')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [badgeData, setBadgeData] = useState<BadgePayload | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const { signOut } = useClerk()
  const { isSignedIn, user: clerkUser } = useUser()

  // 로그아웃 시 상태를 지우는 대신 파생값에서 무시한다 (effect 내 setState 회피).
  const badges = isSignedIn ? badgeData : null

  const userId = isSignedIn ? clerkUser?.id : undefined
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress
  const avatarUrl = badges?.profile?.avatar_url ?? clerkUser?.imageUrl
  const fullName = badges?.profile?.full_name ?? clerkUser?.fullName
  const unreadCount = badges?.unreadNotifications ?? 0
  const unreadMessageCount = badges?.unreadMessages ?? 0

  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false
    const load = () => {
      fetch('/api/header/badges')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled && data?.signedIn) setBadgeData(data)
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 120000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isSignedIn])

  // 프로필 드롭다운 외부 클릭 닫기 (mousedown 사용 시 언어·화폐 포털 모달 클릭이 선행되어 컴포넌트가 언마운트됨)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!profileRef.current || profileRef.current.contains(target)) return
      if (target instanceof Element && target.closest('[data-header-overlay-portal]')) return
      setProfileOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // 모바일 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const openLanguagePicker = () => {
    setProfileOpen(false)
    setLanguageOpen(true)
  }

  const closeMobile = () => setMobileOpen(false)

  const mobileRightIcons = (
    <div className="flex items-center gap-0.5 shrink-0">
      <LocaleTriggerButton
        currentLocale={locale}
        compact
        open={languageOpen}
        onClick={openLanguagePicker}
      />
      {userId && (
        <>
          <MessagesPanel locale={locale} unreadCount={unreadMessageCount} />
          <NotificationsPanel locale={locale} unreadCount={unreadCount} />
        </>
      )}
      {!userId && <CurrencySelector compact />}
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setMobileOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-full text-body hover:bg-surface-hover transition-colors shrink-0"
        aria-label={tMenu}
      >
        <Menu style={{ width: 20, height: 20 }} />
      </button>
    </div>
  )

  return (
    <>
      {/* 모바일: 로고 + 액션 | 데스크탑: 로고 + 네비 */}
      <div className="flex items-center min-h-12 md:min-h-14 md:h-14 md:gap-2 sm:md:gap-3 w-full min-w-0">
        <div className="flex justify-between items-center w-full md:contents">
          {logoSlot}
          <div className="md:hidden shrink-0">{mobileRightIcons}</div>
        </div>

        <div className="hidden md:flex flex-1 w-full min-w-0">
      {/* ── 데스크탑 레이아웃: flex-1 으로 가운데 + 오른쪽 정렬 ── */}
      <div className="hidden md:flex flex-1 items-center justify-between">
        <ExploreMegaMenu primaryLinks={primaryNavLinks} groups={megaMenuGroups} locale={locale} />

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/${locale}/bookmarks`}
          className="w-9 h-9 flex items-center justify-center rounded-full text-body hover:bg-surface-hover transition-colors"
          title={tBookmarks}
        >
          <Bookmark className="w-5 h-5" />
        </Link>

        {userId ? (
          <>
            {/* 메시지 패널 */}
            <MessagesPanel locale={locale} unreadCount={unreadMessageCount} />

            {/* 알림 패널 */}
            <NotificationsPanel locale={locale} unreadCount={unreadCount} />

            {/* 프로필 드롭다운 */}
            <div ref={profileRef} className="relative ml-1">
              <button
                suppressHydrationWarning
                onClick={() => setProfileOpen(v => !v)}
                aria-label={tc('profileMenu')}
                aria-expanded={profileOpen}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-surface-hover transition-colors"
              >
                {/* 아바타 */}
                <Avatar src={avatarUrl} name={fullName ?? userEmail} size={28} fallbackClassName="bg-brand text-white" />
                <ChevronDown className={`w-3.5 h-3.5 text-hint transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-edge/60 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-edge/60">
                    <p className="font-semibold text-heading text-sm truncate">{fullName || userEmail}</p>
                    {fullName && <p className="text-xs text-hint truncate mt-0.5">{userEmail}</p>}
                  </div>
                  <div className="py-1.5">
                    <DropLink href={`/${locale}/profile`} icon={<User className="w-4 h-4" />} label={tProfile} onClick={() => setProfileOpen(false)} />
                    <DropLink href={`/${locale}/dashboard`} icon={<LayoutDashboard className="w-4 h-4" />} label={tDashboard} onClick={() => setProfileOpen(false)} />
                    <DropLink href={`/${locale}/bookmarks`} icon={<Bookmark className="w-4 h-4" />} label={tBookmarks} onClick={() => setProfileOpen(false)} />
                  </div>
                  <div className="mx-4 my-1 h-px bg-gold/20" />
                  <div className="py-1">
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover transition-colors rounded-lg mx-1">
                      <span className="flex items-center gap-3 text-sm text-body">
                        <span className="text-hint">🌐</span>
                        {tLanguage}
                      </span>
                      <LocaleTriggerButton
                        currentLocale={locale}
                        compact
                        open={languageOpen}
                        onClick={openLanguagePicker}
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover transition-colors rounded-lg mx-1">
                      <span className="flex items-center gap-3 text-sm text-body">
                        <span className="text-hint">💱</span>
                        {tCurrency}
                      </span>
                      <CurrencySelector compact />
                    </div>
                  </div>
                  <div className="mx-4 my-1 h-px bg-edge/60" />
                  <div className="py-1">
                    <button
                      suppressHydrationWarning
                      onClick={() => signOut({ redirectUrl: `/${locale}` })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-light transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {tLogout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* 로그인 전: 언어·화폐 선택 (로그인 버튼 왼쪽) */}
            <div className="flex items-center gap-0.5 mr-1">
              <LocaleTriggerButton
                currentLocale={locale}
                compact
                open={languageOpen}
                onClick={openLanguagePicker}
              />
              <CurrencySelector compact />
            </div>
            <Link href={`/${locale}/login`}>
              <button suppressHydrationWarning className="ml-1 bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
                {tLogin}
              </button>
            </Link>
          </>
        )}
        </div>{/* end 오른쪽 영역 */}
      </div>{/* end 데스크탑 flex-1 wrapper */}
        </div>
      </div>{/* end outer flex */}

      {/* ── 모바일 메뉴 오버레이 (Portal로 body에 직접 마운트 → 부모 stacking context 영향 없음) ── */}
      {mobileOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* 배경 딤처리 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* 메뉴 패널 */}
          <div className="absolute right-0 top-0 h-dvh max-h-[100dvh] w-[min(100vw-1.5rem,24rem)] max-w-[24rem] bg-white shadow-2xl flex flex-col overflow-hidden pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex items-center justify-between px-4 py-4 border-b border-edge/60 shrink-0">
              {userId ? (
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={avatarUrl}
                    name={fullName ?? userEmail}
                    size={40}
                    fallbackClassName="bg-brand text-white"
                    className="ring-2 ring-brand/20"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-heading text-sm truncate">{fullName || userEmail}</p>
                    {fullName && <p className="text-xs text-hint truncate mt-0.5">{userEmail}</p>}
                  </div>
                </div>
              ) : (
                <span className="font-bold text-heading text-lg">{tMenu}</span>
              )}
              <button
                suppressHydrationWarning
                type="button"
                onClick={closeMobile}
                aria-label={tc('closeMenu')}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover text-subtle transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-y-contain">
              <MobileMegaMenu
                guestLogin={!userId ? { href: `/${locale}/login`, label: tLogin } : undefined}
                primaryLinks={primaryNavLinks}
                groups={megaMenuGroups}
                locale={locale}
                pathname={pathname}
                onNavigate={closeMobile}
                accountLabel={tAccount}
                moreLabel={tMobileMore}
              />

              {userId && (
                <div className="px-3 py-2 border-t border-edge/60">
                  <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-hint">{tAccount}</p>
                  <MobileMenuLink href={`/${locale}/profile`} icon={<User className="w-4 h-4" />} label={tProfile} onClick={closeMobile} />
                  <MobileMenuLink href={`/${locale}/dashboard`} icon={<LayoutDashboard className="w-4 h-4" />} label={tDashboard} onClick={closeMobile} />
                  <MobileMenuLink href={`/${locale}/bookmarks`} icon={<Bookmark className="w-4 h-4" />} label={tBookmarks} onClick={closeMobile} />
                  <MobileMenuLink href={`/${locale}/messages`} icon={<MessageSquare className="w-4 h-4" />} label={tMessages} badge={unreadMessageCount} onClick={closeMobile} />
                </div>
              )}

            {/* 설정 */}
            <div className="px-3 py-2 border-t border-edge/60">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-surface-hover transition-colors">
                <span className="flex items-center gap-3 text-sm font-medium text-body">
                  <span className="text-hint">🌐</span>
                  {tLanguage}
                </span>
                <LocaleTriggerButton
                  currentLocale={locale}
                  compact
                  open={languageOpen}
                  onClick={() => { closeMobile(); openLanguagePicker() }}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-surface-hover transition-colors">
                <span className="flex items-center gap-3 text-sm font-medium text-body">
                  <span className="text-hint">💱</span>
                  {tCurrency}
                </span>
                <CurrencySelector compact />
              </div>
            </div>
            </div>

            {/* 로그아웃 */}
            {userId && (
              <div className="px-4 py-3 border-t border-edge/60 shrink-0">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => { closeMobile(); signOut({ redirectUrl: `/${locale}` }) }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-danger border border-danger-light hover:bg-danger-light transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {tLogout}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <LanguageSelector
        currentLocale={locale}
        userId={userId}
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        hideTrigger
        onOverlayOpen={() => {
          setProfileOpen(false)
          setMobileOpen(false)
        }}
      />
    </>
  )
}

// 데스크탑 드롭다운 링크
function DropLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-body hover:bg-surface-hover transition-colors">
      <span className="text-hint">{icon}</span>
      {label}
    </Link>
  )
}

// 모바일 메뉴 링크
function MobileMenuLink({ href, icon, label, badge, onClick }: {
  href: string; icon: React.ReactNode; label: string; badge?: number; onClick: () => void
}) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-body hover:bg-surface-hover transition-colors mb-0.5">
      <span className="text-hint">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-brand text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
