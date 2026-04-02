'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'

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
  postTitle: string
  locale: string
  currentUserId: string | null
  hostId: string
  hostName: string
  initialQuestions: QuestionItem[]
}

export default function QuestionsSection({
  postId,
  postTitle,
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

  const supabase = createClient()

  const handleSubmit = async () => {
    if (!currentUserId) {
      setError(t('qaLoginError'))
      return
    }
    if (!content.trim()) {
      setError(t('qaEmptyError'))
      return
    }
    setSubmitting(true)
    setError('')
    const text = content.trim()
    setContent('')

    const { data, error: dbError } = await supabase
      .from('companion_questions')
      .insert({
        post_id: postId,
        question_user_id: currentUserId,
        question_content: text,
      })
      .select()
      .single()

    setSubmitting(false)
    if (dbError || !data) {
      setError(t('qaSubmitFail'))
      return
    }

    // 호스트 알림은 DB 트리거(notify_on_new_question)에서 전송

    setQuestions(prev => [
      ...prev,
      {
        id: data.id,
        question: data.question_content,
        question_created_at: data.question_created_at,
        question_user_id: data.question_user_id,
        question_user_name: 'You',
        answer: data.answer_content,
        answer_created_at: data.answer_created_at,
      },
    ])
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

    const { data, error: dbError } = await supabase
      .from('companion_questions')
      .update({
        answer_user_id: currentUserId,
        answer_content: text,
        answer_created_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select()
      .single()

    setSubmitting(false)
    if (dbError || !data) {
      setError(t('qaAnswerFail'))
      return
    }

    // 질문자 알림은 DB 트리거(notify_on_new_answer)에서 전송

    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              answer: data.answer_content,
              answer_created_at: data.answer_created_at,
            }
          : q
      )
    )
    setAnswerDrafts(prev => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
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
                      {new Date(q.question_created_at).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <p className="text-body whitespace-pre-wrap">
                    {q.question}
                  </p>
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
                          {new Date(q.answer_created_at).toLocaleDateString('en-US')}
                        </span>
                      )}
                    </div>
                    <p className="text-body whitespace-pre-wrap">
                      {q.answer}
                    </p>
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

