import { login, signup, signInWithGoogle, signInWithApple, signInWithFacebook } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Logo from '@/components/Logo'
import LoginInAppGate from './LoginInAppGate'
import { getTranslations } from 'next-intl/server'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { locale } = await params
  const { message } = await searchParams
  const t = await getTranslations({ locale, namespace: 'Auth' })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <LoginInAppGate>
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

            {/* Top banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-center">
              <Logo className="h-9 mb-3 mx-auto brightness-0 invert" darkBg />
              <p className="text-blue-100 text-sm">
                Join millions of travelers worldwide 🌍
              </p>
            </div>

            <div className="px-8 py-8 space-y-5">

              {/* ── Social Login Buttons ── */}
            <div className="space-y-3">

              {/* Google */}
              <form>
                <input type="hidden" name="locale" value={locale} />
                <button
                  formAction={signInWithGoogle}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-gray-700 text-sm shadow-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="flex-1 text-center">Continue with Google</span>
                </button>
              </form>

              {/* Apple */}
              <form>
                <input type="hidden" name="locale" value={locale} />
                <button
                  formAction={signInWithApple}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-900 bg-gray-900 hover:bg-black transition-all font-semibold text-white text-sm shadow-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="shrink-0">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.23.7 3 .75 1.14-.23 2.24-.89 3.46-.84 1.46.07 2.56.63 3.27 1.66-3.02 1.78-2.3 5.73.57 6.84-.55 1.5-1.27 3-2.3 4.47zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="flex-1 text-center">Continue with Apple</span>
                </button>
              </form>

              {/* Facebook */}
              <form>
                <input type="hidden" name="locale" value={locale} />
                <button
                  formAction={signInWithFacebook}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#1877F2] bg-[#1877F2] hover:bg-[#166FE5] transition-all font-semibold text-white text-sm shadow-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="shrink-0">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="flex-1 text-center">Continue with Facebook</span>
                </button>
              </form>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* ── Email Login Form ── */}
            <form className="space-y-4">
              <input type="hidden" name="locale" value={locale} />

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="h-11 rounded-xl border-gray-200 focus:border-blue-400"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">{t('passwordLabel')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="h-11 rounded-xl border-gray-200 focus:border-blue-400"
                />
              </div>

              {/* 메시지: 회원가입/로그인 버튼 바로 위에 표시해 사용자가 바로 인지할 수 있도록 */}
              {message && (
                <div className={`rounded-xl p-3.5 text-sm text-center border ${
                  message.includes('Could not')
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  {message === 'Check email to continue sign in process'
                    ? '✉️ Check your email for a confirmation link!'
                    : message === 'Could not authenticate user'
                    ? '❌ Incorrect email or password. Please try again.'
                    : message}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  formAction={login}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  {t('loginBtn')}
                </button>
                <button
                  formAction={signup}
                  className="flex-1 h-11 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-sm transition-colors"
                >
                  {t('signupBtn')}
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { emoji: '✈️', label: 'Find Travel Companions' },
            { emoji: '🗺️', label: 'Local Guides' },
            { emoji: '🏆', label: 'Bucket List' },
          ].map(item => (
            <div key={item.label} className="bg-white/80 rounded-2xl py-3 px-2 backdrop-blur-sm shadow-sm">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <div className="text-xs font-medium text-gray-600 leading-tight">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      </LoginInAppGate>
    </div>
  )
}
