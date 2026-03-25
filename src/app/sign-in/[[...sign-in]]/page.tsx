import { SignIn } from '@clerk/nextjs'
import OAuthButtons from '@/components/OAuthButtons'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <OAuthButtons mode="signIn" />
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-edge" />
          <span className="text-xs text-hint">또는 이메일로</span>
          <div className="flex-1 border-t border-edge" />
        </div>
        <SignIn
          appearance={{
            elements: {
              socialButtonsBlock: 'hidden',
              dividerRow: 'hidden',
              dividerText: 'hidden',
            },
          }}
        />
      </div>
    </div>
  )
}
