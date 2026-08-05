'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Avatar from '@/components/ui/Avatar'

interface Props {
  targetProfile: { id: string; full_name: string | null; avatar_url: string | null }
  locale: string
  existingReview?: { id: string; rating: number; content: string | null } | null
}

export default function ReviewForm({ targetProfile, locale, existingReview }: Props) {
  const router = useRouter()
  const tc = useTranslations('Common')
  const t = useTranslations('Reviews')
  const isEdit = !!existingReview

  /** 별점별 한 줄 평. 인덱스 = 별 개수. */
  const ratingWords = ['', t('ratingPoor'), t('ratingFair'), t('ratingGood'), t('ratingGreat'), t('ratingExcellent')]

  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existingReview?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) { setError(t('selectRatingError')); return }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? { reviewId: existingReview.id, rating, content: comment.trim() || null }
            : { revieweeId: targetProfile.id, rating, content: comment.trim() || null }
        ),
      })
      const body = await res.json().catch(() => ({}))
      setSaving(false)
      if (!res.ok) {
        setError(body?.error || t('submitFailed'))
        return
      }
    } catch {
      setSaving(false)
      setError(tc('networkError'))
      return
    }

    router.push(`/${locale}/users/${targetProfile.id}`)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!existingReview) return
    if (!confirm(tc('deleteConfirm'))) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/reviews?reviewId=${existingReview.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      setDeleting(false)
      if (!res.ok) {
        setError(body?.error || t('deleteFailed'))
        return
      }
    } catch {
      setDeleting(false)
      setError(tc('networkError'))
      return
    }

    router.push(`/${locale}/users/${targetProfile.id}`)
    router.refresh()
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-8 max-w-lg mx-auto space-y-6">
      {/* 대상 유저 */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-brand-muted flex items-center justify-center text-2xl overflow-hidden">
          {targetProfile.avatar_url ? (
            <Avatar src={targetProfile.avatar_url} name={targetProfile.full_name} size={56} fill />
          ) : '👤'}
        </div>
        <div>
          <p className="font-bold text-heading text-lg">{targetProfile.full_name || tc('anonymous')}</p>
          <p className="text-sm text-subtle">{isEdit ? t('editYourReview') : t('travelReview')}</p>
        </div>
      </div>

      {/* 별점 */}
      <div>
        <p className="font-medium text-body mb-3">{tc('rating')} <span className="text-danger">*</span></p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              aria-label={ratingWords[star]}
              className="text-4xl transition-transform hover:scale-110"
            >
              {star <= (hovered || rating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-subtle mt-2">
            {ratingWords[rating]}
          </p>
        )}
      </div>

      {/* 코멘트 */}
      <div>
        <p className="font-medium text-body mb-2">{t('commentOptional')}</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={t('shareExperienceWithPerson')}
          aria-label={t('commentOptional')}
          rows={4}
          className="w-full rounded-xl border border-edge px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {error && <p className="text-danger text-sm">❌ {error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()} className="rounded-xl px-4">
          {tc('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || rating === 0}
          className="flex-1 bg-brand hover:bg-brand-hover rounded-xl"
        >
          {saving ? tc('saving') : isEdit ? t('updateReview') : t('submitReview')}
        </Button>
        {isEdit && (
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border-danger-border text-danger hover:bg-danger-light px-4"
          >
            {deleting ? tc('deleting') : `🗑️ ${tc('delete')}`}
          </Button>
        )}
      </div>
    </div>
  )
}
