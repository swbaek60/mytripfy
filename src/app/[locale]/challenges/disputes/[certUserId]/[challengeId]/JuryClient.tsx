'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DisputeLabels } from '@/data/dispute-labels'

export default function JuryClient({
  certUserId,
  challengeId,
  locale,
  canVote,
  myVote,
  isReporter,
  isCertOwner,
  currentUserId,
  labels,
}: {
  certUserId: string
  challengeId: string
  locale: string
  canVote: boolean
  myVote: string | null
  isReporter: boolean
  isCertOwner: boolean
  currentUserId: string | null
  labels: DisputeLabels
}) {
  const L = labels
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [voting, setVoting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleVote = async (vote: 'valid' | 'invalid') => {
    if (!currentUserId) { router.push(`/${locale}/login`); return }
    setVoting(true)
    setError('')
    try {
      const res = await fetch('/api/challenges/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cert_user_id: certUserId, cert_challenge_id: challengeId, vote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '투표 실패')

      setResult(data.result)
      setTimeout(() => {
        startTransition(() => router.refresh())
      }, 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setVoting(false)
    }
  }

  if (result) {
    return (
      <div className="mt-5 text-center py-6 bg-purple-50 rounded-2xl">
        {result === 'invalidated' && (
          <>
            <div className="text-4xl mb-2">❌</div>
            <p className="font-bold text-red-700">판결: 인증 무효!</p>
            <p className="text-sm text-gray-500 mt-1">인증이 취소되고 포인트가 차감되었습니다.</p>
          </>
        )}
        {result === 'dismissed' && (
          <>
            <div className="text-4xl mb-2">✅</div>
            <p className="font-bold text-green-700">판결: 정당한 인증!</p>
            <p className="text-sm text-gray-500 mt-1">딴지가 기각되었습니다.</p>
          </>
        )}
        {result === 'pending' && (
          <>
            <div className="text-4xl mb-2">🗳️</div>
            <p className="font-bold text-blue-700">투표 완료 (+2pt 적립 예정)</p>
            <p className="text-sm text-gray-500 mt-1">아직 최종 판결이 나지 않았습니다. 더 많은 배심원 투표가 필요합니다.</p>
          </>
        )}
      </div>
    )
  }

  if (myVote) {
    return (
      <div className="mt-5 bg-purple-50 rounded-2xl p-4 text-center">
        <p className="font-semibold text-gray-700">
          {L.jury.alreadyVoted}: {myVote === 'valid' ? L.jury.validBtn : L.jury.invalidBtn}
        </p>
        <p className="text-xs text-gray-400 mt-1">Final verdict will appear when decided.</p>
      </div>
    )
  }

  if (isCertOwner) {
    return (
      <div className="mt-5 bg-amber-50 rounded-2xl p-4 text-center">
        <p className="text-sm font-semibold text-amber-700">⚠️ {L.jury.ownerNote}</p>
      </div>
    )
  }

  if (isReporter) {
    return (
      <div className="mt-5 bg-gray-50 rounded-2xl p-4 text-center">
        <p className="text-sm font-semibold text-gray-600">{L.buttonText} submitted.</p>
        <p className="text-xs text-gray-400 mt-1">{L.jury.reporterNote}</p>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="mt-5 bg-gray-50 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-500 mb-2">Login required to vote.</p>
        <a href={`/${locale}/login`} className="text-purple-600 font-bold text-sm underline">Login →</a>
      </div>
    )
  }

  if (!canVote) {
    return null
  }

  return (
    <div className="mt-5 bg-blue-50 rounded-2xl p-5 border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">⚖️</span>
        <div>
          <p className="font-bold text-blue-900 text-sm">{L.jury.title}</p>
          <p className="text-xs text-blue-600">{L.jury.rewardNote}</p>
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
        Review the certification photo and flag reasons, then vote honestly.
      </p>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl mb-3">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleVote('valid')}
          disabled={voting}
          className="flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-40"
        >
          {voting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          <span>{L.jury.validBtn}</span>
        </button>
        <button
          onClick={() => handleVote('invalid')}
          disabled={voting}
          className="flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40"
        >
          {voting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          <span>{L.jury.invalidBtn}</span>
        </button>
      </div>
    </div>
  )
}
