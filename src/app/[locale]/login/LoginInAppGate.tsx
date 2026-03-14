'use client'

import { useState, useEffect } from 'react'
import { isInAppBrowser } from '@/components/InAppBrowserNotice'
import InAppBrowserNotice from '@/components/InAppBrowserNotice'

/** 인앱 브라우저로 로그인 페이지 접속 시: 로그인 폼 대신 "브라우저에서 열기" 안내만 표시 */
export default function LoginInAppGate({ children }: { children: React.ReactNode }) {
  const [isInApp, setIsInApp] = useState<boolean | null>(null)

  useEffect(() => {
    setIsInApp(isInAppBrowser())
  }, [])

  if (isInApp === null) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="px-8 py-12 text-center text-gray-400 text-sm">
            잠시만요...
          </div>
        </div>
      </div>
    )
  }

  if (isInApp) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="px-8 py-8">
            <InAppBrowserNotice standalone />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
