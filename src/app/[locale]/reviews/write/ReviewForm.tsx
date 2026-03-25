'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
  targetProfile: { id: string; full_name: string | null; avatar_url: string | null }
  locale: string
  existingReview?: { id: string; rating: number; content: string | null } | null
}

export default function ReviewForm({ user, targetProfile, locale, existingReview }: Props) {
  const router = useRouter()
  const isEdit = !!existingReview

  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existingReview?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a rating.'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()

    if (isEdit) {
      // 수정
      const { error: dbError } = await supabase
        .from('reviews')
        .update({ rating, content: comment.trim() || null })
        .eq('id', existingReview.id)
      setSaving(false)
      if (dbError) { setError('Failed to update review. ' + dbError.message); return }
    } else {
      // 새 작성
      const { error: dbError } = await supabase.from('reviews').insert({
        reviewer_id: user.id,
        reviewee_id: targetProfile.id,
        rating,
        content: comment.trim() || null,
      })
      setSaving(false)
      if (dbError) { setError('Failed to submit review. ' + dbError.message); return }
    }

    router.push(`/${locale}/users/${targetProfile.id}`)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!existingReview) return
    if (!confirm('정말 이 리뷰를 삭제하시겠습니까?')) return
    setDeleting(true)
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', existingReview.id)
    setDeleting(false)
    if (dbError) { setError('Failed to delete review. ' + dbError.message); return }
    router.push(`/${locale}/users/${targetProfile.id}`)
    router.refresh()
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-8 max-w-lg mx-auto space-y-6">
      {/* 대상 유저 */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-brand-muted flex items-center justify-center text-2xl overflow-hidden">
          {targetProfile.avatar_url ? (
            <img src={targetProfile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : '👤'}
        </div>
        <div>
          <p className="font-bold text-heading text-lg">{targetProfile.full_name || 'Anonymous'}</p>
          <p className="text-sm text-subtle">{isEdit ? 'Edit your review' : 'Travel Review'}</p>
        </div>
      </div>

      {/* 별점 */}
      <div>
        <p className="font-medium text-body mb-3">Rating <span className="text-danger">*</span></p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="text-4xl transition-transform hover:scale-110"
            >
              {star <= (hovered || rating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-subtle mt-2">
            {['', 'Poor 😞', 'Fair 😐', 'Good 😊', 'Great 😃', 'Excellent 🤩'][rating]}
          </p>
        )}
      </div>

      {/* 코멘트 */}
      <div>
        <p className="font-medium text-body mb-2">Comment (optional)</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience traveling with this person..."
          rows={4}
          className="w-full rounded-xl border border-edge px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {error && <p className="text-danger text-sm">❌ {error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()} className="rounded-xl px-4">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || rating === 0}
          className="flex-1 bg-brand hover:bg-brand-hover rounded-xl"
        >
          {saving ? 'Saving...' : isEdit ? '✏️ Update Review' : '⭐ Submit Review'}
        </Button>
        {isEdit && (
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border-red-200 text-danger hover:bg-danger-light px-4"
          >
            {deleting ? 'Deleting...' : '🗑️ Delete'}
          </Button>
        )}
      </div>
    </div>
  )
}
