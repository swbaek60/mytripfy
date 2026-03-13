'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, MessageSquare, Menu, X, LogOut, User, LayoutDashboard, Bookmark, ChevronDown, Users, Compass, Store, Trophy, Award } from 'lucide-react'
import { logout } from '@/app/[locale]/actions'
import LanguageSelector from '@/components/LanguageSelector'
import CurrencySelector from '@/components/CurrencySelector'

interface NavLink {
  href: string
  label: string
}

interface Props {
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

  return (
    <>
      {/* ── 데스크탑 레이아웃: flex-1 으로 가운데 + 오른쪽 정렬 ── */}
      <div className="hidden md:flex flex-1 items-center justify-between">
        {/* 가운데 네비게이션 */}
        <nav className="flex items-center gap-0.5 mx-auto">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold tracking-tight transition-colors ${
                isActive(link.href)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-1 shrink-0">

        {userId ? (
          <>
            {/* 메시지 */}
            <Link href={`/${locale}/messages`} title={tMessages}
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors">
              <MessageSquare className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              {unreadMessageCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </Link>

            {/* 알림 */}
            <Link href={`/${locale}/notifications`} title={tNotifications}
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors">
              <Bell style={{ width: 18, height: 18 }} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* 프로필 드롭다운 */}
            <div ref={profileRef} className="relative ml-1">
              <button
                suppressHydrationWarning
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {/* 아바타 */}
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden">
                  {/* 사용자 정보 */}
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm truncate">{fullName || userEmail}</p>
                    {fullName && <p className="text-xs text-gray-400 truncate">{userEmail}</p>}
                  </div>
                  <div className="py-1">
                    <DropLink href={`/${locale}/profile`} icon={<User className="w-4 h-4" />} label={tProfile} onClick={() => setProfileOpen(false)} />
                    <DropLink href={`/${locale}/dashboard`} icon={<LayoutDashboard className="w-4 h-4" />} label={tDashboard} onClick={() => setProfileOpen(false)} />
                    <DropLink href={`/${locale}/bookmarks`} icon={<Bookmark className="w-4 h-4" />} label={tBookmarks} onClick={() => setProfileOpen(false)} />
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors">
                      <span className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="text-gray-400">🌐</span>
                        Language
                      </span>
                      <LanguageSelector currentLocale={locale} compact userId={userId} />
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors">
                      <span className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="text-gray-400">💱</span>
                        Currency
                      </span>
                      <CurrencySelector compact />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <form>
                      <input type="hidden" name="locale" value={locale} suppressHydrationWarning />
                      <button
                        suppressHydrationWarning
                        formAction={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {tLogout}
                      </button>
                    </form>
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
              <button suppressHydrationWarning className="ml-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
                {tLogin}
              </button>
            </Link>
          </>
        )}
        </div>{/* end 오른쪽 영역 */}
      </div>{/* end 데스크탑 flex-1 wrapper */}

      {/* ── 모바일: 메인 메뉴 5개 아이콘 (바로 인지) + 메시지/알림 + 햄버거 ── */}
      <div className="md:hidden flex flex-1 items-center min-w-0 gap-1">
        {/* 메인 메뉴 5개: 가용 공간만 쓰고 부족하면 가로 스크롤 */}
        <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
          <nav className="flex items-center gap-0.5 justify-end pr-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                title={link.label}
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 transition-colors ${
                  isActive(link.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {navIcons[link.href] ?? <span className="text-xs font-bold">?</span>}
              </Link>
            ))}
          </nav>
        </div>
        {/* 오른쪽 고정: 메시지·알림·햄버거 (로고와 겹치지 않도록 shrink-0) */}
        <div className="flex items-center gap-0.5 shrink-0">
          {userId && (
            <>
              <Link href={`/${locale}/messages`} title={tMessages}
                className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors">
                <MessageSquare style={{ width: 18, height: 18 }} />
                {unreadMessageCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>
              <Link href={`/${locale}/notifications`} title={tNotifications}
                className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors">
                <Bell style={{ width: 18, height: 18 }} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}
          <button
            suppressHydrationWarning
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={tMenu}
          >
            <Menu style={{ width: 20, height: 20 }} />
          </button>
        </div>
      </div>

      {/* ── 모바일 메뉴 오버레이 ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* 배경 딤처리 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* 메뉴 패널 (오른쪽에서 슬라이드, 모바일 전체 높이·태블릿 적정 너비) */}
          <div className="absolute right-0 top-0 bottom-0 w-[min(100vw-3rem,20rem)] max-w-[20rem] bg-white shadow-2xl flex flex-col overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            {/* 메뉴 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              {userId ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{fullName || userEmail}</p>
                    {fullName && <p className="text-xs text-gray-400">{userEmail}</p>}
                  </div>
                </div>
              ) : (
                <span className="font-bold text-gray-900">{tMenu}</span>
              )}
              <button
                suppressHydrationWarning
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 사용자 메뉴 (메인 5개는 헤더 아이콘으로 표시됨) */}
            {userId ? (
              <>
                <div className="px-3 py-3 border-b border-gray-100">
                  <MobileMenuLink href={`/${locale}/profile`} icon={<User className="w-4 h-4" />} label={tProfile} onClick={() => setMobileOpen(false)} />
                  <MobileMenuLink href={`/${locale}/dashboard`} icon={<LayoutDashboard className="w-4 h-4" />} label={tDashboard} onClick={() => setMobileOpen(false)} />
                  <MobileMenuLink href={`/${locale}/bookmarks`} icon={<Bookmark className="w-4 h-4" />} label={tBookmarks} onClick={() => setMobileOpen(false)} />
                  <MobileMenuLink href={`/${locale}/messages`} icon={<MessageSquare className="w-4 h-4" />} label={tMessages} badge={unreadMessageCount} onClick={() => setMobileOpen(false)} />
                </div>
              </>
            ) : (
              <div className="px-4 py-4 border-b border-gray-100">
                <Link href={`/${locale}/login`} onClick={() => setMobileOpen(false)}>
                  <button suppressHydrationWarning className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 rounded-xl transition-colors">
                    {tLogin}
                  </button>
                </Link>
              </div>
            )}

            {/* 설정 */}
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <span className="text-gray-400">🌐</span>
                  {tLanguage}
                </span>
                <LanguageSelector currentLocale={locale} compact userId={userId} />
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <span className="text-gray-400">💱</span>
                  {tCurrency}
                </span>
                <CurrencySelector compact />
              </div>
            </div>

            {/* 로그아웃 */}
            {userId && (
              <div className="px-4 py-3 mt-auto">
                <form>
                  <input type="hidden" name="locale" value={locale} suppressHydrationWarning />
                  <button
                    suppressHydrationWarning
                    formAction={logout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {tLogout}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// 데스크탑 드롭다운 링크
function DropLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
      <span className="text-gray-400">{icon}</span>
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
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-0.5">
      <span className="text-gray-400">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
