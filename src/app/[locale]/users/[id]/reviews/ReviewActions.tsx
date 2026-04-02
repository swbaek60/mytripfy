'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, X, Check } from 'lucide-react'

interface Props {
  reviewId: string
  initialRating: number
  initialContent: string | null
}

export default function ReviewActions({ reviewId, initialRating, initialContent }: Props) {
  const router = useRouter()
  const tc = useTranslations('Common')
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(initialRating)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState(initialContent || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (rating === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, rating, content: content.trim() || null }),
      })
      setSaving(false)
      if (res.ok) {
        setEditing(false)
        router.refresh()
      } else {
        alert(tc('errorOccurred'))
      }
    } catch {
      setSaving(false)
      alert(tc('errorOccurred'))
    }
  }

  const handleDelete = async () => {
    if (!confirm(tc('deleteConfirm'))) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, { method: 'DELETE' })
      setDeleting(false)
      if (res.ok) {
        router.refresh()
      } else {
        alert(tc('errorOccurred'))
      }
    } catch {
      setDeleting(false)
      alert(tc('errorOccurred'))
    }
  }

  if (editing) {
    return (
      <div className="mt-3 bg-brand-light border border-edge-brand rounded-xl p-4 space-y-3">
        {/* 별점 */}
        <div>
          <p className="text-xs font-medium text-body mb-1.5">Rating</p>
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
          <p className="text-xs font-medium text-body mb-1.5">Comment</p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-edge px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Share your experience..."
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || rating === 0}
            className="bg-brand hover:bg-brand-hover text-white rounded-full text-xs px-4 flex items-center gap-1"
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
        className="flex items-center gap-1 text-xs text-hint hover:text-brand transition-colors px-2 py-1 rounded-lg hover:bg-brand-light"
        title="Edit review"
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1 text-xs text-hint hover:text-danger transition-colors px-2 py-1 rounded-lg hover:bg-danger-light"
        title="Delete review"
      >
        <Trash2 className="w-3 h-3" />
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
