'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Siren } from 'lucide-react'
import type { DisputeLabels } from '@/data/dispute-labels'

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return ''
  const base = 127397
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => base + c.charCodeAt(0)))
}

type CertItem = {
  user_id: string
  challenge_id: string
  image_url: string
  created_at: string
  dispute_status: string
  full_name: string
  avatar_url: string | null
  title_en: string
  title_ko: string
  title?: string
  category: string
  points: number
  country_code: string | null
  dispute_count: number
  already_disputed: boolean
}

// STATUS_UI is built dynamically from labels inside component

export default function CertFeedClient({
  certs,
  currentUserId,
  locale,
  myCertCount,
  labels: L,
}: {
  certs: CertItem[]
  currentUserId: string | null
  locale: string
  myCertCount: number
  labels: DisputeLabels
}) {
  const STATUS_UI = {
    clean:       { label: L.status.clean,       color: 'text-success', bg: 'bg-success-light' },
    flagged:     { label: L.status.flagged,     color: 'text-gold', bg: 'bg-gold-light' },
    reviewing:   { label: L.status.reviewing,   color: 'text-brand-hover',  bg: 'bg-brand-light' },
    invalidated: { label: L.status.invalidated, color: 'text-danger',   bg: 'bg-danger-light' },
  } as Record<string, { label: string; color: string; bg: string }>

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [disputeTarget, setDisputeTarget] = useState<CertItem | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedImg, setExpandedImg] = useState<string | null>(null)

  const filtered = certs.filter(c => {
    if (filterStatus !== 'all' && c.dispute_status !== filterStatus) return false
    const searchTitle = (c.title ?? c.title_en).toLowerCase()
    if (search && !searchTitle.includes(search.toLowerCase()) &&
        !c.full_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const canDispute = myCertCount >= 3

  const handleDispute = async () => {
    if (!currentUserId) { router.push(`/${locale}/login`); return }
    if (!disputeTarget || !reason.trim() || reason.trim().length < 10) return

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/challenges/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cert_user_id: disputeTarget.user_id,
          cert_challenge_id: disputeTarget.challenge_id,
          reason: reason.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '신고 실패')
      setSuccessMsg(L.successMsg)
      setTimeout(() => {
        setDisputeTarget(null)
        setReason('')
        setSuccessMsg('')
        startTransition(() => router.refresh())
      }, 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* 필터 바 */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input
          type="text"
          placeholder="챌린지명 또는 사용자 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border border-edge rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40 bg-surface"
        />
        {[
          { key: 'all',       label: 'All' },
          { key: 'clean',     label: L.status.clean },
          { key: 'flagged',   label: L.status.flagged },
          { key: 'reviewing', label: L.status.reviewing },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterStatus === f.key
                ? 'bg-purple text-white border-purple'
                : 'bg-surface text-body border-edge hover:border-purple/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '전체 인증', value: certs.length, icon: '🏅' },
          { label: '딴지 진행', value: certs.filter(c => c.dispute_status === 'reviewing').length, icon: '⚖️' },
          { label: '신고 접수', value: certs.filter(c => c.dispute_status === 'flagged').length, icon: '🚨' },
        ].map((s, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-edge p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-extrabold text-heading">{s.value}</div>
            <div className="text-xs text-hint">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-hint">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-medium">결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cert => {
            const isOwn = cert.user_id === currentUserId
            const status = STATUS_UI[cert.dispute_status] ?? STATUS_UI.clean
            const canFlag = !isOwn && !cert.already_disputed && cert.dispute_status !== 'reviewing'

            return (
              <div
                key={`${cert.user_id}-${cert.challenge_id}`}
                className={`bg-surface rounded-2xl overflow-hidden border-2 transition-all ${
                  cert.dispute_status === 'reviewing' ? 'border-edge-brand' :
                  cert.dispute_status === 'flagged'   ? 'border-gold/20' :
                  'border-edge hover:border-purple/30'
                }`}
              >
                {/* 인증 사진 */}
                <div
                  className="relative h-44 cursor-pointer group"
                  onClick={() => setExpandedImg(cert.image_url)}
                >
                  <img
                    src={cert.image_url}
                    alt={cert.title_en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* 상태 뱃지 */}
                  <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                    {status.label}
                  </div>

                  {/* 딴지 수 뱃지 */}
                  {cert.dispute_count > 0 && (
                    <div className="absolute top-2 left-2 bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      🚨 {cert.dispute_count}건
                    </div>
                  )}

                  <div className="absolute bottom-2 left-3 text-white flex items-center gap-1.5">
                    {cert.country_code && (
                      <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] shrink-0 text-base">
                        {countryFlag(cert.country_code)}
                      </span>
                    )}
                    <p className="text-xs font-semibold opacity-80 truncate">
                      {cert.title ?? cert.title_en}
                    </p>
                    <p className="text-[10px] opacity-60">
                      {new Date(cert.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                    +{cert.points}pt
                  </div>
                </div>

                {/* 카드 바디 */}
                <div className="p-4">
                  {/* 사용자 정보 */}
                  <div className="flex items-center gap-2 mb-3">
                    {cert.avatar_url ? (
                      <img src={cert.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple to-indigo flex items-center justify-center text-white text-xs font-bold">
                        {cert.full_name[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-heading leading-none">{cert.full_name}</p>
                      <p className="text-[10px] text-hint mt-0.5 capitalize">{cert.category}</p>
                    </div>
                  </div>

                  {/* 챌린지명 (locale별 번역) */}
                  <p className="text-sm font-bold text-heading line-clamp-1">{cert.title ?? cert.title_en}</p>

                  {/* 액션 버튼 */}
                  <div className="mt-3 flex gap-2">
                    {cert.dispute_status === 'reviewing' && (
                      <Link
                        href={`/${locale}/challenges/disputes/${cert.user_id}/${cert.challenge_id}`}
                        className="flex-1 text-center bg-brand-light border border-edge-brand text-brand-hover text-xs font-bold py-2 rounded-xl hover:bg-brand-light transition-colors"
                      >
                        {L.jury.title.split(' ').slice(0, 2).join(' ')}
                      </Link>
                    )}
                    {isOwn && cert.dispute_status !== 'clean' && (
                      <div className={`flex-1 text-center text-xs font-semibold py-2 rounded-xl ${status.bg} ${status.color}`}>
                        My cert · {status.label}
                      </div>
                    )}
                    {isOwn && cert.dispute_status === 'clean' && (
                      <div className="flex-1 text-center bg-success-light text-success text-xs font-semibold py-2 rounded-xl">
                        {L.status.clean} My cert
                      </div>
                    )}
                    {!isOwn && cert.already_disputed && (
                      <div className="flex-1 text-center bg-surface-sunken text-hint text-xs font-semibold py-2 rounded-xl">
                        {L.alreadyFlagged}
                      </div>
                    )}
                    {canFlag && (
                      <button
                        onClick={() => {
                          if (!currentUserId) { router.push(`/${locale}/login`); return }
                          if (myCertCount < 3) { alert('딴지걸기는 인증 3개 이상인 회원만 가능합니다.'); return }
                          setDisputeTarget(cert)
                          setReason('')
                          setError('')
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-danger-light border border-red-200 text-danger text-xs font-bold py-2 rounded-xl hover:bg-danger-light transition-colors"
                      >
                        <Siren className="w-3.5 h-3.5" />{L.buttonText}
                      </button>
                    )}
                    {!isOwn && currentUserId && myCertCount < 3 && !cert.already_disputed && (
                      <div className="flex-1 text-center bg-surface-sunken text-hint text-xs py-2 rounded-xl">
                        Need 3 certs
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 딴지걸기 모달 ── */}
      {disputeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setDisputeTarget(null)}
          />
          <div className="relative bg-surface rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">{L.actionVerb}</p>
                  <h2 className="text-xl font-extrabold leading-tight">{disputeTarget.title ?? disputeTarget.title_en}</h2>
                  <p className="text-sm opacity-80 mt-0.5">by {disputeTarget.full_name}</p>
                </div>
                <button
                  onClick={() => !submitting && setDisputeTarget(null)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {successMsg ? (
                <div className="text-center py-6">
                  <div className="flex justify-center mb-3"><Siren className="w-14 h-14 text-danger" /></div>
                  <p className="text-lg font-bold text-heading">딴지 접수 완료!</p>
                  <p className="text-sm text-subtle mt-1">{successMsg}</p>
                </div>
              ) : (
                <>
                  {/* 인증 사진 미리보기 */}
                  <div className="relative h-36 rounded-2xl overflow-hidden mb-4">
                    <img src={disputeTarget.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>

                  {/* 안내 */}
                  <div className="bg-gold-light border border-gold/20 rounded-xl p-3 mb-4 text-sm text-gold">
                    {L.stakeWarning}
                  </div>

                  {/* Reason input */}
                  <label className="block text-sm font-bold text-heading mb-2">
                    Reason <span className="text-danger">*</span>
                    <span className="font-normal text-hint ml-1">(min 10 chars)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={L.reasonPlaceholder}
                    rows={4}
                    className="w-full border border-edge rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <p className={`text-xs mt-1 ${reason.length < 10 ? 'text-danger' : 'text-success'}`}>
                    {reason.length}/10자 이상 필요
                  </p>

                  {error && (
                    <div className="mt-3 text-danger text-sm bg-danger-light p-3 rounded-xl">{error}</div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setDisputeTarget(null)}
                      disabled={submitting}
                      className="flex-1 border border-edge text-body font-semibold py-3 rounded-xl hover:bg-surface-hover transition-colors text-sm"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDispute}
                      disabled={submitting || reason.trim().length < 10}
                      className="flex-1 bg-danger text-white font-bold py-3 rounded-xl hover:bg-danger transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          처리 중...
                        </span>
                      ) : <span className="flex items-center justify-center gap-1.5"><Siren className="w-4 h-4" />딴지 접수하기</span>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 이미지 확대 모달 ── */}
      {expandedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setExpandedImg(null)}
        >
          <img
            src={expandedImg}
            alt=""
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setExpandedImg(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 text-xl"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
