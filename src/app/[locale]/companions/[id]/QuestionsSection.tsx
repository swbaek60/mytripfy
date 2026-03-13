'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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

  const supabase = createClient()

  const handleSubmit = async () => {
    if (!currentUserId) {
      setError('로그인 후 질문을 남길 수 있습니다.')
      return
    }
    if (!content.trim()) {
      setError('질문 내용을 입력해주세요.')
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
      setError('질문 등록에 실패했습니다. 다시 시도해주세요.')
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
      setError('답변 등록에 실패했습니다. 다시 시도해주세요.')
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
    <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">💬 Trip Q&amp;A</h3>
        <p className="text-xs text-gray-400">
          일정·예산·준비물 등 다른 신청자에게도 도움이 되는 질문을 남겨주세요.
        </p>
      </div>

      {currentUserId ? (
        currentUserId === hostId ? (
          <p className="text-sm text-gray-500">
            이 섹션은 여행자(신청자)가 남긴 질문을 모아두는 공간입니다. 호스트는 아래 질문에 답변만 남길 수 있습니다.
          </p>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              placeholder="이 여행에 대해 궁금한 점을 남겨주세요. (예: 예산 범위, 숙소 타입, 이동수단 등)"
              className="text-sm"
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full px-4"
              >
                {submitting ? '등록 중...' : '질문 등록'}
              </Button>
            </div>
          </div>
        )
      ) : (
        <p className="text-sm text-gray-500">
          질문을 남기려면 먼저 로그인해주세요.
        </p>
      )}

      <div className="border-t border-gray-100 pt-4">
        {questions.length === 0 ? (
          <p className="text-sm text-gray-400">
            아직 등록된 Q&amp;A가 없습니다. 첫 번째 질문을 남겨보세요.
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map(q => (
              <div
                key={q.id}
                className="border border-gray-100 rounded-xl p-3 text-sm bg-gray-50 space-y-2"
              >
                {/* Question */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      Q. {q.question_user_name}
                    </span>
                    <span
                      suppressHydrationWarning
                      className="text-xs text-gray-400"
                    >
                      {new Date(q.question_created_at).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {q.question}
                  </p>
                </div>

                {/* Answer */}
                {q.answer ? (
                  <div className="mt-1 pl-3 border-l-2 border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-blue-700">
                        A. {hostName}
                      </span>
                      {q.answer_created_at && (
                        <span
                          suppressHydrationWarning
                          className="text-xs text-gray-400"
                        >
                          {new Date(q.answer_created_at).toLocaleDateString('en-US')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {q.answer}
                    </p>
                  </div>
                ) : currentUserId === hostId ? (
                  <div className="mt-1 pl-3 border-l-2 border-dashed border-blue-200 space-y-2">
                    <p className="text-xs text-gray-400">
                      호스트 답변을 남겨주세요.
                    </p>
                    <Textarea
                      rows={2}
                      value={answerDrafts[q.id] || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      placeholder="여행 조건, 예산, 일정 등에 대해 자세히 답변해주세요."
                      className="text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="xs"
                        onClick={() => handleAnswerSubmit(q.id)}
                        disabled={submitting || !(answerDrafts[q.id] || '').trim()}
                        className="rounded-full px-3 py-1 text-xs"
                      >
                        답변 등록
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    호스트 답변 대기 중입니다.
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

