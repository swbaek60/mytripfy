'use client'

interface Props {
  locale: string
}

/**
 * 같은 탭 이동: 링크 클릭 → /api/auth/facebook-url → 302 리다이렉트로 Supabase OAuth.
 * target="_self" 로 모바일에서도 새 창 방지.
 */
export default function FacebookLoginButton({ locale }: Props) {
  const href = `/api/auth/facebook-url?locale=${encodeURIComponent(locale)}&redirect=1`
  return (
    <a
      href={href}
      target="_self"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-[#1877F2] bg-[#1877F2] hover:bg-[#166FE5] transition-all font-semibold text-white text-sm shadow-sm no-underline"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="shrink-0">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      <span className="flex-1 text-center">Continue with Facebook</span>
    </a>
  )
}
