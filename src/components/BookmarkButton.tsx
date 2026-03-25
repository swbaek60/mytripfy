'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'

interface Props {
  userId: string
  type: 'companion_post' | 'guide'
  referenceId: string
  isBookmarked: boolean
  size?: 'sm' | 'md'
}

export default function BookmarkButton({ userId, type, referenceId, isBookmarked: initial, size = 'md' }: Props) {
  const [bookmarked, setBookmarked] = useState(initial)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    const supabase = createClient()

    if (bookmarked) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', userId).eq('type', type).eq('reference_id', referenceId)
      setBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: userId, type, reference_id: referenceId })
      setBookmarked(true)
    }
    setLoading(false)
    router.refresh()
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const padClass  = size === 'sm' ? 'p-1' : 'p-2'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
      className={`rounded-full transition-all hover:scale-110 ${padClass} ${
        bookmarked ? 'text-brand' : 'text-hint hover:text-blue-400'
      } disabled:opacity-50`}
    >
      <Bookmark className={`${iconSize} ${bookmarked ? 'fill-brand' : ''}`} />
    </button>
  )
}
