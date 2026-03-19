import { headers } from 'next/headers'
import { login, signup } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Logo from '@/components/Logo'
import LoginInAppGate from './LoginInAppGate'
import SocialLoginButtons from './SocialLoginButtons'
import { getTranslations } from 'next-intl/server'

function isMobileUserAgent(ua: string) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}

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
  const headersList = await headers()
  const ua = headersList.get('user-agent') ?? ''
  const isMobile = isMobileUserAgent(ua)

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
              <SocialLoginButtons locale={locale} isMobile={isMobile} />

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
