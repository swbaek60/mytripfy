'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Menu, X, LogOut, User, LayoutDashboard, Bookmark, ChevronDown, Users, Compass, Store, Trophy, Award } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import LanguageSelector from '@/components/LanguageSelector'
import CurrencySelector from '@/components/CurrencySelector'
import NotificationsPanel from '@/components/NotificationsPanel'
import MessagesPanel from '@/components/MessagesPanel'

interface NavLink {
  href: string
  label: string
}

interface Props {
  logoSlot: React.ReactNode
  locale: string
  userId?: string
  userEmail?: string
  avatarUrl?: string | null
  fullName?: string | null
  navLinks: NavLink[]
  unreadCount: number
  unreadMessageCount: number
  tDashboard: string
  tProfile: string
  tLogout: string
  tLogin: string
  tBookmarks: string
  tMessages: string
  tNotifications: string
  tMenu: string
  tLanguage: string
  tCurrency: string
}

export default function HeaderNav({
  logoSlot,
  locale, userId, userEmail,
  avatarUrl, fullName,
  navLinks,
  unreadCount, unreadMessageCount,
  tDashboard, tProfile, tLogout, tLogin, tBookmarks, tMessages, tNotifications,
  tMenu, tLanguage, tCurrency,
}: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { signOut } = useClerk()

  // 프로필 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 모바일 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = (href: string) => pathname.includes(href)

  // 메인 메뉴 5개 아이콘 (모바일에서 햄버거 밖에 표시)
  const navIcons: Record<string, ReactNode> = {
    '/companions': <Users className="w-5 h-5" />,
    '/guides': <Compass className="w-5 h-5" />,
    '/sponsors': <Store className="w-5 h-5" />,
    '/challenges': <Trophy className="w-5 h-5" />,
    '/hall-of-fame': <Award className="w-5 h-5" />,
  }

  // 아바타 이니셜 (fullName 또는 email 첫 글자)
  const initials = fullName
    ? fullName.slice(0, 1).toUpperCase()
    : userEmail?.slice(0, 1).toUpperCase() ?? '?'

  const mobileRightIcons = (
    <div className="flex items-center gap-0.5 shrink-0">
      {userId ? (
        <>
          <MessagesPanel locale={locale} unreadCount={unreadMessageCount} />
          <NotificationsPanel locale={locale} unreadCount={unreadCount} />
          <button
            suppressHydrationWarning
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-body hover:bg-surface-hover transition-colors shrink-0"
            aria-label={tMenu}
          >
            <Menu style={{ width: 20, height: 20 }} />
          </button>
        </>
      ) : (
        <>
          <LanguageSelector currentLocale={locale} compact iconOnly userId={userId} />
          <CurrencySelector compact iconOnly />
          <Link href={`/${locale}/login`}>
            <button suppressHydrationWarning className="bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-full transition-colors shrink-0">
              {tLogin}
            </button>
          </Link>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* 모바일: 1열 = 로고(왼쪽) + 메시지/알림/햄버거(오른쪽) | 데스크탑: 로고만 */}
      <div className="flex flex-col md:flex-row md:items-center md:min-h-14 md:h-14 md:gap-2 sm:md:gap-3 w-full min-w-0">
        <div className="flex justify-between items-center w-full md:contents">
          {logoSlot}
          <div className="md:hidden shrink-0">{mobileRightIcons}</div>
        </div>

        {/* 데스크탑: 가운데 네비 + 오른쪽 영역 | 모바일: 2열 5개 메뉴만 */}
        <div className="flex md:flex-1 w-full min-w-0 flex-col md:flex-row">
      {/* ── 데스크탑 레이아웃: flex-1 으로 가운데 + 오른쪽 정렬 ── */}
      <div className="hidden md:flex flex-1 items-center justify-between">
        {/* 가운데 네비게이션 */}
        <nav className="flex items-center gap-1 mx-auto">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-brand font-semibold'
                  : 'text-body hover:text-heading'
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-1 shrink-0">

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
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-surface-hover transition-colors"
              >
                {/* 아바타 */}
                <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : initials}
                </div>
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
                        Language
                      </span>
                      <LanguageSelector
                        currentLocale={locale}
                        compact
                        userId={userId}
                        onOverlayOpen={() => setProfileOpen(false)}
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover transition-colors rounded-lg mx-1">
                      <span className="flex items-center gap-3 text-sm text-body">
                        <span className="text-hint">💱</span>
                        Currency
                      </span>
                      <CurrencySelector compact onOverlayOpen={() => setProfileOpen(false)} />
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
              <LanguageSelector currentLocale={locale} compact userId={userId} />
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

      {/* ── 모바일 2열: 메인 메뉴 5개만, 가로 100%, 가운데 정렬 ── */}
      <nav className="md:hidden flex w-full items-center justify-center gap-0.5 sm:gap-1 min-h-11 py-1 px-1">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={`/${locale}${link.href}`}
            title={link.label}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 min-w-0 flex-1 max-w-[4.5rem] rounded-lg transition-colors ${
              isActive(link.href)
                ? 'text-brand'
                : 'text-subtle hover:text-body'
            }`}
          >
            <span className="shrink-0">{navIcons[link.href] ?? <span className="text-xs font-bold">?</span>}</span>
            <span className="text-[10px] sm:text-[11px] font-medium leading-tight truncate w-full text-center">
              {link.label}
            </span>
            {isActive(link.href) && (
              <span className="absolute -bottom-1 left-2 right-2 h-0.5 bg-brand rounded-full" />
            )}
          </Link>
        ))}
      </nav>
        </div>{/* end flex md:flex-1 wrapper */}
      </div>{/* end outer flex flex-col */}

      {/* ── 모바일 메뉴 오버레이 (Portal로 body에 직접 마운트 → 부모 stacking context 영향 없음) ── */}
      {mobileOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* 배경 딤처리 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* 메뉴 패널 */}
          <div className="absolute right-0 top-0 h-dvh max-h-[100dvh] w-[min(100vw-3rem,20rem)] max-w-[20rem] bg-white shadow-2xl flex flex-col overflow-y-auto overscroll-y-contain pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex items-center justify-between px-5 py-5 border-b border-edge/60">
              {userId ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-brand/20">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <div>
                    <p className="font-semibold text-heading text-sm">{fullName || userEmail}</p>
                    {fullName && <p className="text-xs text-hint mt-0.5">{userEmail}</p>}
                  </div>
                </div>
              ) : (
                <span className="font-bold text-heading text-lg">{tMenu}</span>
              )}
              <button
                suppressHydrationWarning
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover text-subtle transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* 사용자 메뉴 (메인 5개는 헤더 아이콘으로 표시됨) */}
            {userId ? (
              <>
                <div className="px-3 py-3 border-b border-edge">
                  <MobileMenuLink href={`/${locale}/profile`} icon={<User className="w-4 h-4" />} label={tProfile} onClick={() => setMobileOpen(false)} />
                  <MobileMenuLink href={`/${locale}/dashboard`} icon={<LayoutDashboard className="w-4 h-4" />} label={tDashboard} onClick={() => setMobileOpen(false)} />
                  <MobileMenuLink href={`/${locale}/bookmarks`} icon={<Bookmark className="w-4 h-4" />} label={tBookmarks} onClick={() => setMobileOpen(false)} />
                  <MobileMenuLink href={`/${locale}/messages`} icon={<MessageSquare className="w-4 h-4" />} label={tMessages} badge={unreadMessageCount} onClick={() => setMobileOpen(false)} />
                </div>
              </>
            ) : (
              <div className="px-4 py-4 border-b border-edge">
                <Link href={`/${locale}/login`} onClick={() => setMobileOpen(false)}>
                  <button suppressHydrationWarning className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-medium py-3 rounded-xl transition-colors">
                    {tLogin}
                  </button>
                </Link>
              </div>
            )}

            {/* 설정 */}
            <div className="px-3 py-2 border-b border-edge">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-surface-hover transition-colors">
                <span className="flex items-center gap-3 text-sm font-medium text-body">
                  <span className="text-hint">🌐</span>
                  {tLanguage}
                </span>
                <LanguageSelector
                  currentLocale={locale}
                  compact
                  userId={userId}
                  onOverlayOpen={() => setMobileOpen(false)}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-surface-hover transition-colors">
                <span className="flex items-center gap-3 text-sm font-medium text-body">
                  <span className="text-hint">💱</span>
                  {tCurrency}
                </span>
                <CurrencySelector compact onOverlayOpen={() => setMobileOpen(false)} />
              </div>
            </div>

            {/* 로그아웃 */}
            {userId && (
              <div className="px-4 py-3 mt-auto">
                <button
                  suppressHydrationWarning
                  onClick={() => { setMobileOpen(false); signOut({ redirectUrl: `/${locale}` }) }}
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
