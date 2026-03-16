'use client'

import { useState } from 'react'

interface Props {
  locale: string
}

export default function FacebookLoginButton({ locale }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/auth/facebook-url?locale=${locale}`)
      const json = await res.json()
      if (!json.url) throw new Error('No URL')
      window.location.href = json.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#1877F2] bg-[#1877F2] hover:bg-[#166FE5] transition-all font-semibold text-white text-sm shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="shrink-0 animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="shrink-0">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )}
      <span className="flex-1 text-center">
        {loading ? 'Connecting...' : 'Continue with Facebook'}
      </span>
    </button>
  )
}
