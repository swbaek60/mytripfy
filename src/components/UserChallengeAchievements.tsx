'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trophy, Siren, Trash2 } from 'lucide-react'
import DisputeModal, { type DisputeTargetCert } from '@/components/DisputeModal'

const CATEGORY_EMOJI: Record<string, string> = {
  countries: '🌍',
  restaurants: '🍽️',
  foods: '🍜',
  drinks: '🍶',
  attractions: '🏛️',
  museums: '🏺',
  art_galleries: '🖼️',
  nature: '🏔️',
  islands: '🏝️',
  animals: '🦁',
  festivals: '🎭',
  golf: '⛳',
  fishing: '🎣',
  surfing: '🏄',
  skiing: '⛷️',
  scuba: '🤿',
}

// 이미지 밑 뱃지: 각 인증의 실제 카테고리명 표시 (음식/맛집, 명소, 골프, 낚시 등)
const CATEGORY_LABEL: Record<string, { ko: string; en: string }> = {
  countries: { ko: '국가', en: 'Countries' },
  restaurants: { ko: '맛집', en: 'Restaurants' },
  foods: { ko: '음식', en: 'Foods' },
  drinks: { ko: '음료', en: 'Drinks' },
  attractions: { ko: '명소', en: 'Attractions' },
  museums: { ko: '박물관', en: 'Museums' },
  art_galleries: { ko: '미술관', en: 'Art' },
  nature: { ko: '자연', en: 'Nature' },
  islands: { ko: '섬', en: 'Islands' },
  animals: { ko: '동물', en: 'Animals' },
  festivals: { ko: '축제', en: 'Festivals' },
  golf: { ko: '골프', en: 'Golf' },
  fishing: { ko: '낚시', en: 'Fishing' },
  surfing: { ko: '서핑', en: 'Surfing' },
  skiing: { ko: '스키', en: 'Skiing' },
  scuba: { ko: '다이빙', en: 'Scuba' },
}

// 음식(foods)과 맛집(restaurants)은 한 섹션 '음식'으로 통합
const CATEGORY_ORDER = [
  'countries', 'attractions', 'foods', 'drinks',
  'museums', 'art_galleries', 'nature', 'islands', 'animals',
  'festivals', 'golf', 'fishing', 'surfing', 'skiing', 'scuba',
]

export type CertificationItem = {
  id: string
  challenge_id: string
  image_url: string | null
  created_at: string
  dispute_status?: string
  challenges: {
    id: string
    title_en: string
    title_ko: string | null
    category: string
    image_url: string | null
  } | null
}

export default function UserChallengeAchievements({
  userId,
  certifications,
  challengePoints,
  experiencePoints,
  contributionPoints,
  locale,
  compact = false,
  // 딴지걸기 지원 props
  currentUserId,
  myCertCount = 0,
  disputedKeys,
}: {
  userId: string
  certifications: CertificationItem[]
  challengePoints: number
  experiencePoints?: number
  contributionPoints?: number
  locale: string
  compact?: boolean
  currentUserId?: string | null
  myCertCount?: number
  disputedKeys?: Set<string>
}) {
  const t = useTranslations('UserProfile')
  const displayTitle = (c: CertificationItem) =>
    locale.startsWith('ko') && c.challenges?.title_ko ? c.challenges.title_ko : (c.challenges?.title_en ?? '')

  const [expandedImg, setExpandedImg] = useState<string | null>(null)
  const [disputeTarget, setDisputeTarget] = useState<DisputeTargetCert | null>(null)
  const [localDisputedKeys, setLocalDisputedKeys] = useState<Set<string>>(disputedKeys ?? new Set())
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null)

  const router = useRouter()
  const isOwnProfile = currentUserId === userId
  const canDispute = !!currentUserId && !isOwnProfile && myCertCount >= 3

  const exp = experiencePoints ?? challengePoints
  const contrib = contributionPoints ?? 0
  const hasPoints = certifications.length > 0 || challengePoints > 0 || exp > 0 || contrib > 0
  if (!hasPoints) return null

  const displayList = compact ? certifications.slice(0, 12) : certifications.slice(0, 36)
  const byCategory = new Map<string, CertificationItem[]>()
  for (const cert of displayList) {
    const raw = cert.challenges?.category ?? 'other'
    const cat = raw === 'restaurants' ? 'foods' : raw
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(cert)
  }
  const orderedCategories = [
    ...CATEGORY_ORDER.filter(c => byCategory.has(c)),
    ...[...byCategory.keys()].filter(c => !CATEGORY_ORDER.includes(c)),
  ]

  const getKey = (cert: CertificationItem) => `${userId}_${cert.challenge_id}`

  const deleteCert = async (challengeId: string) => {
    if (!isOwnProfile) return
    if (!confirm(t('cancelCertConfirm'))) return
    setDeletingCertId(challengeId)
    try {
      const res = await fetch('/api/challenges/certs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t('deleteFailed'))
      }
      router.refresh()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t('cancelCertFailed'))
    } finally {
      setDeletingCertId(null)
    }
  }

  const renderCertCard = (cert: CertificationItem) => {
    const img = cert.image_url || (cert.challenges as { image_url?: string } | null)?.image_url
    const category = cert.challenges?.category ?? ''
    const emoji = CATEGORY_EMOJI[category] ?? '✅'
    const categoryLabel = CATEGORY_LABEL[category] ? (locale.startsWith('ko') ? CATEGORY_LABEL[category].ko : CATEGORY_LABEL[category].en) : category || 'Challenge'
    const key = getKey(cert)
    const alreadyDisputed = localDisputedKeys.has(key)
    const dispStatus = cert.dispute_status || 'clean'
    const showDisputeBtn = !isOwnProfile && !!cert.image_url && !alreadyDisputed && dispStatus !== 'reviewing' && dispStatus !== 'invalidated'

    return (
      <div
        key={cert.id}
        className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-square bg-surface-sunken ${
          dispStatus === 'reviewing' ? 'border-edge-brand' :
          dispStatus === 'flagged' ? 'border-amber-200' :
          dispStatus === 'invalidated' ? 'border-red-200 opacity-60' :
          'border-edge hover:border-amber-200 hover:shadow-md'
        }`}
        title={`${emoji} ${categoryLabel} · ${displayTitle(cert)}`}
      >
        {img ? (
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-zoom-in"
            onClick={() => setExpandedImg(img)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-amber-50 to-orange-50">
            {emoji}
          </div>
        )}

        {/* 카테고리 뱃지 (항상 표시: 국가/음식/맛집 등 구분) */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 text-white text-[9px] font-medium py-0.5 px-1.5 flex items-center justify-center gap-0.5 truncate">
          <span className="shrink-0">{emoji}</span>
          <span className="truncate">{categoryLabel}</span>
        </div>

        {/* 챌린지명 hover */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-white text-[10px] font-medium truncate">{displayTitle(cert)}</p>
        </div>

        {/* 상태 뱃지 */}
        {dispStatus !== 'clean' && (
          <div className={`absolute top-1 left-1 text-[8px] font-bold px-1 py-0.5 rounded-full ${
            dispStatus === 'reviewing' ? 'bg-brand text-white' :
            dispStatus === 'flagged' ? 'bg-amber-400 text-white' : 'bg-danger text-white'
          }`}>
            {dispStatus === 'reviewing' ? '⚖️' : dispStatus === 'flagged' ? '🚨' : '❌'}
          </div>
        )}

        {/* 내 프로필일 때: 인증 취소 버튼 */}
        {isOwnProfile && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteCert(cert.challenge_id)
            }}
            disabled={deletingCertId === cert.challenge_id}
            className="absolute top-1 right-1 w-6 h-6 bg-surface-sunken0/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:opacity-50"
            title={t('cancelCert')}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        {/* 딴지걸기 버튼 */}
        {showDisputeBtn && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!currentUserId) { router.push(`/${locale}/login?returnTo=${encodeURIComponent(window.location.pathname)}`); return }
              if (myCertCount < 3) { alert(t('disputeRequires')); return }
              setDisputeTarget({
                user_id: userId,
                challenge_id: cert.challenge_id,
                image_url: cert.image_url!,
                full_name: '',
                challenge_title: displayTitle(cert),
              })
            }}
            className="absolute top-1 right-1 w-6 h-6 bg-danger/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
            title="딴지걸기"
          >
            <Siren className="w-3 h-3" />
          </button>
        )}

        {alreadyDisputed && (
          <div className="absolute top-1 right-1 bg-surface-sunken0/80 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">접수</div>
        )}

        {/* 배심원 링크 */}
        {dispStatus === 'reviewing' && (
          <Link
            href={`/${locale}/challenges/disputes/${userId}/${cert.challenge_id}`}
            onClick={e => e.stopPropagation()}
            className="absolute inset-0 z-10"
            title="배심원 심사 참여"
          />
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-bold text-heading text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          {t('challengeAchievements')}
        </h2>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          {experiencePoints !== undefined && contributionPoints !== undefined ? (
            <>
              <span className="font-bold text-amber flex items-center gap-1">
                <Trophy className="w-4 h-4" /> {t('experiencePoints')} {exp} {t('pointsShort')}
              </span>
              <span className="text-hint">·</span>
              <span className="font-bold text-amber flex items-center gap-1">
                <Trophy className="w-4 h-4" /> {t('contributionPoints')} {contrib} {t('pointsShort')}
              </span>
            </>
          ) : (
            <span className="font-bold text-amber">{challengePoints} {t('pointsShort')}</span>
          )}
          <span className="text-hint">·</span>
          <span className="text-body">{certifications.length} {t('certifiedShort')}</span>
        </div>
      </div>

      {currentUserId && !isOwnProfile && myCertCount < 3 && (
        <p className="text-xs text-amber bg-amber-light border border-amber-200 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-1">
          <Siren className="w-3.5 h-3.5" /> {t('disputeRequires')}
        </p>
      )}

      {certifications.length > 0 ? (
        <>
          {/* 카테고리 필터 (2개 이상일 때만) */}
          {orderedCategories.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                type="button"
                onClick={() => setCategoryFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === '' ? 'bg-amber-light0 text-white' : 'bg-surface-sunken text-body hover:bg-surface-hover'
                }`}
              >
                {t('allCategory')} ({displayList.length})
              </button>
              {orderedCategories.map((cat) => {
                const list = byCategory.get(cat)!
                const emoji = CATEGORY_EMOJI[cat] ?? '✅'
                const label = CATEGORY_LABEL[cat] ? (locale.startsWith('ko') ? CATEGORY_LABEL[cat].ko : CATEGORY_LABEL[cat].en) : cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                      categoryFilter === cat ? 'bg-amber-light0 text-white' : 'bg-surface-sunken text-body hover:bg-surface-hover'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                    <span className="opacity-80">({list.length})</span>
                  </button>
                )
              })}
            </div>
          )}
          {(categoryFilter === '' ? orderedCategories : [categoryFilter].filter(c => byCategory.has(c))).map((category) => {
            const list = byCategory.get(category)!
            const emoji = CATEGORY_EMOJI[category] ?? '✅'
            const categoryLabel = CATEGORY_LABEL[category] ? (locale.startsWith('ko') ? CATEGORY_LABEL[category].ko : CATEGORY_LABEL[category].en) : category
            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-body mb-2 flex items-center gap-1.5">
                  <span>{emoji}</span>
                  <span>{categoryLabel}</span>
                  <span className="text-hint font-normal">({list.length})</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {list.map((cert) => renderCertCard(cert))}
                </div>
              </div>
            )
          })}
          <Link
            href={`/${locale}/challenges`}
            className="inline-block mt-4 text-sm font-semibold text-amber hover:text-amber-700"
          >
            {t('viewAllChallenges')} →
          </Link>
        </>
      ) : (
        <>
          <p className="text-subtle text-sm mb-2">{t('noCertificationsYet')}</p>
          <Link href={`/${locale}/challenges`} className="text-sm font-semibold text-amber hover:text-amber-700">
            {t('viewAllChallenges')} →
          </Link>
        </>
      )}

      {/* 이미지 확대 */}
      {expandedImg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setExpandedImg(null)}>
          <img src={expandedImg} alt="" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={() => setExpandedImg(null)} className="absolute top-4 right-4 w-10 h-10 bg-surface/20 text-white rounded-full flex items-center justify-center hover:bg-surface/30 text-xl">✕</button>
        </div>
      )}

      {/* 딴지걸기 모달 */}
      {disputeTarget && (
        <DisputeModal
          target={disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onSuccess={(uid, cid) => {
            setLocalDisputedKeys(prev => new Set([...prev, `${uid}_${cid}`]))
            setDisputeTarget(null)
          }}
        />
      )}
    </div>
  )
}
