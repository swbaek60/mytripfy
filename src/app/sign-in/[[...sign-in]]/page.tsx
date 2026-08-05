import { SignIn } from '@clerk/nextjs'
import { SITE_URL } from '@/lib/seo/site'
import type { Metadata } from 'next'

// 로그인 화면은 로케일 세그먼트 밖에 있어 번역 문맥이 없다. 색인만 막는다.
export const metadata: Metadata = {
  title: 'Log in – mytripfy',
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-sunken to-brand-light p-4">
      <SignIn
        oauthFlow="redirect"
        fallbackRedirectUrl={SITE_URL}
        signUpFallbackRedirectUrl={SITE_URL}
      />
    </div>
  )
}
