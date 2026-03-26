'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const REVIEW_TAGS = [
  { id: 'friendly', label: '😊 Friendly' },
  { id: 'punctual', label: '⏰ Punctual' },
  { id: 'communicative', label: '💬 Communicative' },
  { id: 'responsible', label: '🤝 Responsible' },
  { id: 'fun', label: '🎉 Fun' },
  { id: 'helpful', label: '🙌 Helpful' },
  { id: 'flexible', label: '🔄 Flexible' },
  { id: 'organized', label: '📋 Organized' },
]

export default function ReviewForm({
  revieweeId,
  revieweeName,
  postId,
  locale,
}: {
  revieweeId: string
  revieweeName: string
  postId?: string
  locale: string
}) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revieweeId,
          postId: postId || null,
          rating,
          content: content.trim() || null,
          tags: selectedTags.length > 0 ? selectedTags : null,
        }),
      })
      const data = await res.json()

      setLoading(false)
      if (!res.ok) {
        if (res.status === 409 || data?.error?.includes('already')) {
          setError('You have already reviewed this person for this trip.')
        } else {
          setError(data?.error || 'Failed to submit review. Please try again.')
        }
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch {
      setLoading(false)
      setError('Failed to submit review. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="bg-success-light border border-green-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">⭐</div>
        <p className="text-success font-semibold">Review submitted!</p>
        <p className="text-success text-sm mt-1">Thank you for your feedback.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-5">
      <h3 className="font-bold text-heading text-lg">⭐ Write a Review for {revieweeName}</h3>

      {/* Star Rating */}
      <div>
        <label className="text-sm font-medium text-body block mb-2">Rating *</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            >
              <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-hint'}>
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-subtle self-center ml-2">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-body block mb-2">Tags (optional)</label>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface text-body border-edge-strong hover:border-blue-400'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="text-sm font-medium text-body block mb-2">Review (optional)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share your experience traveling with this person..."
          rows={4}
          maxLength={500}
          className="w-full rounded-xl border border-edge px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <p className="text-xs text-hint text-right mt-1">{content.length}/500</p>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="w-full bg-brand hover:bg-brand-hover rounded-xl"
      >
        {loading ? 'Submitting...' : '⭐ Submit Review'}
      </Button>
    </div>
  )
}
