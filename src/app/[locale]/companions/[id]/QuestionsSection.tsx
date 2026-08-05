'use client'

import { useState } from 'react'
import { api, errorMessage } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'
import TranslatedText from '@/components/TranslatedText'

interface QuestionItem {
  id: string
  question: string
  question_created_at: string
  question_user_id: string
  question_user_name: string
  answer: string | null
  answer_created_at: string | null
}

interface Props {
  postId: string
  locale: string
  currentUserId: string | null
  hostId: string
  hostName: string
  initialQuestions: QuestionItem[]
}

export default function QuestionsSection({
  postId,
  locale,
  currentUserId,
  hostId,
  hostName,
  initialQuestions,
}: Props) {
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions)
  const [content, setContent] = useState('')
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const t = useTranslations('CompanionDetail')

  const handleSubmit = async () => {
    if (!currentUserId) {
      setError(t('qaLoginError'))
      return
    }
    const text = content.trim()
    if (!text) {
      setError(t('qaEmptyError'))
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const { question } = await api.post<{
        question: {
          id: string
          question_content: string
          question_created_at: string
          question_user_id: string
        }
      }>('/api/companions/questions', { postId, content: text })

      setContent('')
      setQuestions(prev => [
        ...prev,
        {
          id: question.id,
          question: question.question_content,
          question_created_at: question.question_created_at,
          question_user_id: question.question_user_id,
          question_user_name: 'You',
          answer: null,
          answer_created_at: null,
        },
      ])
    } catch (err) {
      setError(errorMessage(err, t('qaSubmitFail')))
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswerChange = (id: string, value: string) => {
    setAnswerDrafts(prev => ({ ...prev, [id]: value }))
  }

  const handleAnswerSubmit = async (questionId: string) => {
    const text = (answerDrafts[questionId] || '').trim()
    if (!text) return
    if (!currentUserId || currentUserId !== hostId) return

    setSubmitting(true)
    setError('')

    try {
      const { question } = await api.patch<{
        question: { id: string; answer_content: string; answer_created_at: string }
      }>('/api/companions/questions', { questionId, content: text })

      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? { ...q, answer: question.answer_content, answer_created_at: question.answer_created_at }
            : q
        )
      )
      setAnswerDrafts(prev => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    } catch (err) {
      setError(errorMessage(err, t('qaAnswerFail')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-surface rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-heading">{t('tripQA')}</h3>
        <p className="text-xs text-hint">
          {t('qaGuide')}
        </p>
      </div>

      {currentUserId ? (
        currentUserId === hostId ? (
          <p className="text-sm text-subtle">
            {t('qaHostOnly')}
          </p>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              placeholder={t('qaPlaceholder')}
              className="text-sm"
            />
            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full px-4"
              >
                {submitting ? t('qaSubmitting') : t('qaSubmitBtn')}
              </Button>
            </div>
          </div>
        )
      ) : (
        <p className="text-sm text-subtle">
          {t('qaLoginRequired')}
        </p>
      )}

      <div className="border-t border-edge pt-4">
        {questions.length === 0 ? (
          <p className="text-sm text-hint">
            {t('qaEmpty')}
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map(q => (
              <div
                key={q.id}
                className="border border-edge rounded-xl p-3 text-sm bg-surface-sunken space-y-2"
              >
                {/* Question */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-heading">
                      Q. {q.question_user_name}
                    </span>
                    <span
                      suppressHydrationWarning
                      className="text-xs text-hint"
                    >
                      {new Date(q.question_created_at).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <TranslatedText
                    text={q.question}
                    locale={locale}
                    as="p"
                    className="text-body whitespace-pre-wrap"
                  />
                </div>

                {/* Answer */}
                {q.answer ? (
                  <div className="mt-1 pl-3 border-l-2 border-edge-brand">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-brand-hover">
                        A. {hostName}
                      </span>
                      {q.answer_created_at && (
                        <span
                          suppressHydrationWarning
                          className="text-xs text-hint"
                        >
                          {new Date(q.answer_created_at).toLocaleDateString(locale)}
                        </span>
                      )}
                    </div>
                    <TranslatedText
                      text={q.answer}
                      locale={locale}
                      as="p"
                      className="text-body whitespace-pre-wrap"
                    />
                  </div>
                ) : currentUserId === hostId ? (
                  <div className="mt-1 pl-3 border-l-2 border-dashed border-edge-brand space-y-2">
                    <p className="text-xs text-hint">
                      {t('qaHostAnswerHint')}
                    </p>
                    <Textarea
                      rows={2}
                      value={answerDrafts[q.id] || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      placeholder={t('qaAnswerPlaceholder')}
                      className="text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="xs"
                        onClick={() => handleAnswerSubmit(q.id)}
                        disabled={submitting || !(answerDrafts[q.id] || '').trim()}
                        className="rounded-full px-3 py-1 text-xs"
                      >
                        {t('qaAnswerSubmit')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-hint mt-1">
                    {t('qaWaitingAnswer')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

