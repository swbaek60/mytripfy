'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ApiError, api, errorMessage } from '@/lib/client/api'

/** id 는 DB 에 저장되는 값이라 번역하지 않는다. 화면 문구는 Reviews.tag* 키를 쓴다. */
const REVIEW_TAGS = [
  { id: 'friendly', emoji: '😊' },
  { id: 'punctual', emoji: '⏰' },
  { id: 'communicative', emoji: '💬' },
  { id: 'responsible', emoji: '🤝' },
  { id: 'fun', emoji: '🎉' },
  { id: 'helpful', emoji: '🙌' },
  { id: 'flexible', emoji: '🔄' },
  { id: 'organized', emoji: '📋' },
] as const

export default function ReviewForm({
  revieweeId,
  revieweeName,
  postId,
}: {
  revieweeId: string
  revieweeName: string
  postId?: string
}) {
  const router = useRouter()
  const t = useTranslations('Reviews')
  const tc = useTranslations('Common')
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  /** 별점별 한 줄 평. 인덱스 = 별 개수. */
  const ratingWords = ['', t('ratingPoor'), t('ratingFair'), t('ratingGood'), t('ratingGreat'), t('ratingExcellent')]

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(t('selectRatingError'))
      return
    }
    setLoading(true)
    setError('')

    try {
      await api.post('/api/reviews', {
        revieweeId,
        postId: postId || null,
        rating,
        content: content.trim() || null,
        tags: selectedTags.length > 0 ? selectedTags : null,
      })
      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? t('alreadyReviewedTrip')
          : errorMessage(err, t('submitFailed'))
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-success-light border border-success-border rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">⭐</div>
        <p className="text-success font-semibold">{t('submitted')}</p>
        <p className="text-success text-sm mt-1">{t('thankYouFeedback')}</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-6 space-y-5">
      <h3 className="font-bold text-heading text-lg">⭐ {t('writeReviewFor', { name: revieweeName })}</h3>

      {/* Star Rating */}
      <div>
        <label className="text-sm font-medium text-body block mb-2">{t('ratingRequired')}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={ratingWords[star]}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            >
              <span className={(hovered || rating) >= star ? 'text-gold' : 'text-hint'}>
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-subtle self-center ml-2">{ratingWords[rating]}</span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-body block mb-2">{t('tagsOptional')}</label>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface text-body border-edge-strong hover:border-brand'
              }`}
            >
              {tag.emoji} {t(`tag_${tag.id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="text-sm font-medium text-body block mb-2">{t('reviewOptional')}</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t('shareExperienceWithPerson')}
          aria-label={t('reviewOptional')}
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
        {loading ? tc('submitting') : t('submitReview')}
      </Button>
    </div>
  )
}
