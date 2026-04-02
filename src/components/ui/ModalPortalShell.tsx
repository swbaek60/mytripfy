'use client'

import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  onBackdropPointerDown: () => void
}

/**
 * 모바일: 상단·세이프에어리어 기준 (중앙 정렬 시 헤더가 뷰 밖으로 나가는 현상 방지)
 * sm+: 세로·가로 중앙
 */
export default function ModalPortalShell({ children, onBackdropPointerDown }: Props) {
  return (
    <div
      className="fixed inset-0 z-[10050] flex flex-col overflow-hidden sm:items-center sm:justify-center"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div
        role="presentation"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm touch-none"
        style={{ overscrollBehavior: 'none' }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onBackdropPointerDown()
        }}
      />
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-start sm:flex-none sm:justify-center">
        {children}
      </div>
    </div>
  )
}
