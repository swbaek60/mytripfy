'use client'

import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function SSOCallbackPage() {
  const clerk = useClerk()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    ;(async () => {
      if (!clerk.loaded || hasRun.current) return
      hasRun.current = true

      const navigate = async (url: string) => {
        if (url.startsWith('http')) {
          window.location.href = url
        } else {
          router.push(url)
        }
      }

      // 로그인 완료
      if (signIn?.status === 'complete') {
        await clerk.setActive({ session: signIn.createdSessionId })
        navigate('/en')
        return
      }

      // 회원가입 완료
      if (signUp?.status === 'complete') {
        await clerk.setActive({ session: signUp.createdSessionId })
        navigate('/en')
        return
      }

      // 로그인 → 회원가입 전환 (신규 유저가 로그인 시도)
      if ((signIn?.firstFactorVerification as { status?: string })?.status === 'transferable') {
        await signUp?.create({ transfer: true })
        if ((signUp?.status as string) === 'complete') {
          await clerk.setActive({ session: signUp!.createdSessionId })
          navigate('/en')
          return
        }
        navigate('/sign-up')
        return
      }

      // 회원가입 → 로그인 전환 (기존 유저가 회원가입 시도)
      if ((signUp?.verifications?.externalAccount as { status?: string })?.status === 'transferable') {
        await signIn?.create({ transfer: true })
        if ((signIn?.status as string) === 'complete') {
          await clerk.setActive({ session: signIn!.createdSessionId })
          navigate('/en')
          return
        }
        navigate('/sign-in')
        return
      }

      // 추가 정보 필요 시
      if ((signUp?.status as string) === 'missing_requirements') {
        navigate('/sign-up')
        return
      }

      navigate('/sign-in')
    })()
  }, [clerk, signIn, signUp, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="text-sm text-subtle">로그인 처리 중...</p>
      </div>
    </div>
  )
}
