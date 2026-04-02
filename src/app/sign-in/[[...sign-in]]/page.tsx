import { SignIn } from '@clerk/nextjs'
import { SITE_URL } from '@/lib/seo/site'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <SignIn
        oauthFlow="redirect"
        fallbackRedirectUrl={SITE_URL}
        signUpFallbackRedirectUrl={SITE_URL}
      />
    </div>
  )
}
