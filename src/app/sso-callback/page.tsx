'use client'

import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'

export default function SSOCallbackPage() {
  const clerk = useClerk()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const hasRun = useRef(false)

  useEffect(() => {
    ;(async () => {
      if (!clerk.loaded || hasRun.current) return
      hasRun.current = true

      const navigate = async (url: string) => {
        // 하드 리다이렉트: 세션 쿠키가 서버에 확실히 전달되도록 클라이언트 라우팅 대신 전체 페이지 이동
        // router.push()는 클라이언트 사이드 네비게이션이라 모바일에서 세션 쿠키 전파 전에
        // 서버 렌더링이 실행되어 auth()가 null을 반환하는 경우가 있음
        if (url.startsWith('http')) {
          window.location.href = url
        } else {
          window.location.href = url
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
  }, [clerk, signIn, signUp])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="text-sm text-subtle">Processing login...</p>
      </div>
    </div>
  )
}
