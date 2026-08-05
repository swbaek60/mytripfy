'use client'

import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'

interface Props {
  locale: string
  tDashboard: string
  tProfile: string
  tSaved: string
  tLogin: string
}

/**
 * 푸터의 "내 계정" 링크. 로그인 여부를 클라이언트에서 판별한다.
 *
 * 서버에서 auth() 를 호출하면 푸터가 들어 있는 모든 페이지가 동적 렌더링으로
 * 강제되어 블로그·소개 같은 정적 페이지까지 매 요청 렌더링된다.
 */
export default function FooterAccountLinks({ locale, tDashboard, tProfile, tSaved, tLogin }: Props) {
  const { isSignedIn } = useAuth()
  const linkClass = 'hover:text-footer-heading transition-colors'

  if (!isSignedIn) {
    return (
      <div>
        <Link href={`/${locale}/login`} className={linkClass}>{tLogin}</Link>
      </div>
    )
  }

  return (
    <>
      <div><Link href={`/${locale}/dashboard`} className={linkClass}>{tDashboard}</Link></div>
      <div><Link href={`/${locale}/profile`} className={linkClass}>{tProfile}</Link></div>
      <div><Link href={`/${locale}/bookmarks`} className={linkClass}>{tSaved}</Link></div>
    </>
  )
}
