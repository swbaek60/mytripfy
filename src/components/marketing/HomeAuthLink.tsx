'use client'

import { useAuth } from '@clerk/nextjs'
import { Link } from '@/i18n/routing'
import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  loggedInHref: string
  loggedOutHref?: string
}

/** 홈 ISR용 — 로그인 상태는 클라이언트에서만 판별 */
export default function HomeAuthLink({
  loggedInHref,
  loggedOutHref = '/login',
  children,
  ...rest
}: Props) {
  const { isSignedIn } = useAuth()
  return (
    <Link href={isSignedIn ? loggedInHref : loggedOutHref} {...rest}>
      {children}
    </Link>
  )
}
