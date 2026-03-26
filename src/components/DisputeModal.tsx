'use client'

import { useState } from 'react'
import { Siren } from 'lucide-react'

export interface DisputeTargetCert {
  user_id: string
  challenge_id: string
  image_url: string
  full_name: string
  challenge_title?: string
}

interface Props {
  target: DisputeTargetCert
  onClose: () => void
  onSuccess: (userId: string, challengeId: string) => void
}

export default function DisputeModal({ target, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/challenges/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cert_user_id: target.user_id,
          cert_challenge_id: target.challenge_id,
          reason: reason.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '신고 실패')
      }
      setSuccess(true)
      onSuccess(target.user_id, target.challenge_id)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="relative bg-surface rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1">
                <Siren className="w-3.5 h-3.5" /> 딴지걸기
              </p>
              {target.challenge_title && (
                <h2 className="text-lg font-extrabold leading-tight">{target.challenge_title}</h2>
              )}
              <p className="text-sm opacity-80 mt-0.5">by {target.full_name}</p>
            </div>
            <button
              onClick={() => !submitting && onClose()}
              className="w-8 h-8 bg-surface/20 rounded-full flex items-center justify-center hover:bg-surface/30"
            >✕</button>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-3">
                <Siren className="w-14 h-14 text-danger" />
              </div>
              <p className="text-lg font-bold text-heading">딴지 접수 완료!</p>
              <p className="text-sm text-subtle mt-1">3건 이상 신고 시 배심원 심사가 시작됩니다.</p>
            </div>
          ) : (
            <>
              {/* 인증 사진 미리보기 */}
              <div className="relative h-32 rounded-2xl overflow-hidden mb-4">
                <img src={target.image_url} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="bg-gold-light border border-gold/20 rounded-xl p-3 mb-4 text-sm text-gold">
                ⚠️ 딴지를 걸면 <strong>5포인트</strong>가 예치됩니다. 딴지가 기각되면 예치금이 사라집니다.
              </div>

              <label className="block text-sm font-bold text-heading mb-2">
                이유 <span className="text-danger">*</span>
                <span className="font-normal text-hint ml-1">(최소 10자)</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="이 인증이 조작되었거나 챌린지 조건에 맞지 않는 이유를 구체적으로 적어주세요."
                rows={4}
                className="w-full border border-edge rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <p className={`text-xs mt-1 ${reason.length < 10 ? 'text-red-400' : 'text-green-500'}`}>
                {reason.length} / 10자 이상 필요
              </p>

              {error && (
                <div className="mt-3 text-danger text-sm bg-danger-light p-3 rounded-xl">{error}</div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 border border-edge text-body font-semibold py-3 rounded-xl hover:bg-surface-hover transition-colors text-sm"
                >취소</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || reason.trim().length < 10}
                  className="flex-1 bg-danger text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />처리 중...</>
                    : <><Siren className="w-4 h-4" />딴지 접수하기</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
