'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, X, Check } from 'lucide-react'

interface Props {
  reviewId: string
  initialRating: number
  initialContent: string | null
}

export default function ReviewActions({ reviewId, initialRating, initialContent }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(initialRating)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState(initialContent || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (rating === 0) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('reviews')
      .update({ rating, content: content.trim() || null })
      .eq('id', reviewId)
    setSaving(false)
    if (!error) {
      setEditing(false)
      router.refresh()
    } else {
      alert('수정에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 이 리뷰를 삭제하시겠습니까?')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
    setDeleting(false)
    if (!error) {
      router.refresh()
    } else {
      alert('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (editing) {
    return (
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
        {/* 별점 */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Rating</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="text-2xl transition-transform hover:scale-110"
              >
                {star <= (hovered || rating) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        {/* 코멘트 */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Comment</p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your experience..."
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || rating === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs px-4 flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setEditing(false); setRating(initialRating); setContent(initialContent || '') }}
            className="rounded-full text-xs px-4 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 mt-2">
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
        title="Edit review"
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
        title="Delete review"
      >
        <Trash2 className="w-3 h-3" />
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
