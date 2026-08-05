'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/client/api'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'

interface Props {
  type: 'companion_post' | 'guide'
  referenceId: string
  isBookmarked: boolean
  size?: 'sm' | 'md'
}

export default function BookmarkButton({ type, referenceId, isBookmarked: initial, size = 'md' }: Props) {
  const tc = useTranslations('Common')
  const [bookmarked, setBookmarked] = useState(initial)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const { bookmarked: next } = await api.post<{ bookmarked: boolean }>('/api/bookmarks', {
        type,
        referenceId,
      })
      setBookmarked(next)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const padClass  = size === 'sm' ? 'p-1' : 'p-2'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? tc('removeBookmark') : tc('bookmark')}
      aria-label={bookmarked ? tc('removeBookmark') : tc('bookmark')}
      aria-pressed={bookmarked}
      className={`rounded-full transition-all hover:scale-110 ${padClass} ${
        bookmarked ? 'text-brand' : 'text-hint hover:text-brand'
      } disabled:opacity-50`}
    >
      <Bookmark className={`${iconSize} ${bookmarked ? 'fill-brand' : ''}`} />
    </button>
  )
}
