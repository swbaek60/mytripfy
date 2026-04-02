'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { getLevelInfo, getCountryByCode } from '@/data/countries'
import { getTierForPoints, getContributionTierForPoints } from '@/data/challengeTiers'
import { Siren, Users, X } from 'lucide-react'
import DisputeModal, { type DisputeTargetCert } from '@/components/DisputeModal'

type LeaderRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  travel_level: number | null
  nationality: string | null
  challenge_points?: number
  contribution_points?: number
  total_points?: number
}

type CertItem = {
  challenge_id: string
  image_url: string
  created_at: string
  dispute_status: string
  already_disputed: boolean
  challenge_title: string
  challenge_category: string
}

interface Props {
  list: LeaderRow[]
  tab: string
  locale: string
  currentUserId: string | null
  myCertCount: number
  myDisputedKeys: string[]
  tierLabels: Record<string, string>
  anonymousLabel: string
  pointsLabel: string
}

export default function HallOfFameList({
  list,
  tab,
  locale,
  currentUserId,
  myCertCount,
  myDisputedKeys: initialDisputedKeys,
  tierLabels,
  anonymousLabel,
  pointsLabel,
}: Props) {
  const th = useTranslations('HallOfFame')
  const getTier = tab === 'contribution' ? getContributionTierForPoints : getTierForPoints

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [certData, setCertData] = useState<CertItem[]>([])
  const [certLoading, setCertLoading] = useState(false)
  const [expandedUser, setExpandedUser] = useState<LeaderRow | null>(null)
  const [disputeTarget, setDisputeTarget] = useState<DisputeTargetCert | null>(null)
  const [expandedImg, setExpandedImg] = useState<string | null>(null)
  const [localDisputedKeys, setLocalDisputedKeys] = useState<Set<string>>(new Set(initialDisputedKeys))
  const router = useRouter()

  const openCerts = async (profile: LeaderRow, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (expandedUserId === profile.id) {
      setExpandedUserId(null)
      setCertData([])
      setExpandedUser(null)
      return
    }
    setExpandedUserId(profile.id)
    setExpandedUser(profile)
    setCertLoading(true)
    const supabase = createClient()

    // 해당 유저의 인증 목록
    const { data: certs } = await supabase
      .from('challenge_certifications')
      .select('challenge_id, image_url, created_at, dispute_status, challenges(title_en, title_ko, category)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(24)

    // 현재 유저의 딴지 이력 (이 유저에 대해)
    let disputedKeys = new Set(initialDisputedKeys)
    if (currentUserId) {
      const { data: disputes } = await supabase
        .from('challenge_disputes')
        .select('cert_challenge_id')
        .eq('reporter_id', currentUserId)
        .eq('cert_user_id', profile.id)
      disputedKeys = new Set([
        ...initialDisputedKeys,
        ...(disputes || []).map((d: { cert_challenge_id: string }) => `${profile.id}_${d.cert_challenge_id}`),
      ])
      setLocalDisputedKeys(disputedKeys)
    }

    const result: CertItem[] = (certs || []).map((c: Record<string, unknown>) => {
      const ch = c.challenges as { title_en: string; title_ko: string | null; category: string } | null
      const isKo = locale.startsWith('ko') // for title_ko / title_en data selection
      return {
        challenge_id: c.challenge_id as string,
        image_url: c.image_url as string,
        created_at: c.created_at as string,
        dispute_status: (c.dispute_status as string) || 'clean',
        already_disputed: disputedKeys.has(`${profile.id}_${c.challenge_id}`),
        challenge_title: (isKo && ch?.title_ko) ? ch.title_ko : (ch?.title_en || ''),
        challenge_category: ch?.category || '',
      }
    })
    setCertData(result)
    setCertLoading(false)
  }

  return (
    <div>
      <ul className="divide-y divide-edge">
        {list.map((profile, index) => {
          const rank = index + 1
          const levelInfo = getLevelInfo(profile.travel_level ?? 1)
          const displayName = profile.full_name || profile.username || anonymousLabel
          const points = profile.total_points ?? profile.challenge_points ?? profile.contribution_points ?? 0
          const tier = getTier(points)
          const country = profile.nationality ? getCountryByCode(profile.nationality) : null
          const isExpanded = expandedUserId === profile.id
          const canDispute = !!currentUserId && currentUserId !== profile.id && myCertCount >= 3

          return (
            <li key={profile.id}>
              <div className="flex items-center gap-4 px-6 py-4 hover:bg-gold-light/50 transition-colors">
                {/* 순위 */}
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: rank === 1 ? '#d97706' : rank === 2 ? '#6b7280' : rank === 3 ? '#b45309' : '#94a3b8' }}
                >
                  {rank}
                </span>

                {/* 아바타 */}
                <Link href={`/${locale}/users/${profile.id}`} className="shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-surface-sunken flex items-center justify-center text-xl hover:opacity-80 transition-opacity">
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : '👤'}
                  </div>
                </Link>

                {/* 이름/정보 */}
                <Link href={`/${locale}/users/${profile.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-heading truncate">{displayName}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {country && <span className="text-xs text-subtle">{country.emoji} {country.name}</span>}
                    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: levelInfo.color }}>
                      {levelInfo.badge} Lv.{levelInfo.level}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tier.color }}>
                      {tier.emoji}
                    </span>
                  </div>
                </Link>

                {/* 포인트 */}
                <div className="flex-shrink-0 text-right mr-2">
                  <p className="text-lg font-bold text-amber">{points}</p>
                  <p className="text-xs text-subtle">{pointsLabel}</p>
                </div>

                {/* 인증 보기 버튼 */}
                <button
                  onClick={(e) => openCerts(profile, e)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    isExpanded
                      ? 'bg-purple text-white'
                      : 'bg-purple-light text-purple hover:bg-purple-light border border-purple-200'
                  }`}
                  title={th('viewCerts')}
                >
                  <Users className="w-3.5 h-3.5" />
                  {th('viewCerts')}
                </button>
              </div>

              {/* 인증 사진 패널 */}
              {isExpanded && (
                <div className="px-6 pb-5 bg-purple-light/40 border-t border-purple-100">
                  <div className="flex items-center justify-between py-3">
                    <p className="text-sm font-semibold text-body flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple" />
                      {th('certsOf', { name: displayName })}
                      {!certLoading && <span className="text-hint font-normal">{th('certsCount', { count: certData.length })}</span>}
                    </p>
                    <button onClick={() => { setExpandedUserId(null); setCertData([]) }} className="w-6 h-6 bg-surface-sunken rounded-full flex items-center justify-center hover:bg-surface-hover">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {certLoading ? (
                    <div className="text-center py-6 text-hint text-sm">
                      <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      {th('loadingCerts')}
                    </div>
                  ) : certData.length === 0 ? (
                    <p className="text-sm text-hint py-4 text-center">{th('noCerts')}</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {certData.map(cert => {
                        const key = `${profile.id}_${cert.challenge_id}`
                        const alreadyDisputed = localDisputedKeys.has(key) || cert.already_disputed
                        const showDisputeBtn = !alreadyDisputed && cert.dispute_status !== 'reviewing' && cert.dispute_status !== 'invalidated'

                        return (
                          <div
                            key={`${profile.id}-${cert.challenge_id}`}
                            className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              cert.dispute_status === 'reviewing' ? 'border-edge-brand' :
                              cert.dispute_status === 'flagged' ? 'border-gold/20' :
                              cert.dispute_status === 'invalidated' ? 'border-red-200 opacity-60' :
                              'border-transparent hover:border-purple-200'
                            }`}
                          >
                            <img
                              src={cert.image_url}
                              alt={cert.challenge_title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-zoom-in"
                              onClick={() => setExpandedImg(cert.image_url)}
                              title={cert.challenge_title}
                            />

                            {/* 딴지걸기 버튼 */}
                            {showDisputeBtn && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!currentUserId) { router.push(`/${locale}/login?returnTo=${encodeURIComponent(window.location.pathname)}`); return }
                                  if (myCertCount < 3) { alert(th('disputeRequires3Certs')); return }
                                  setDisputeTarget({
                                    user_id: profile.id,
                                    challenge_id: cert.challenge_id,
                                    image_url: cert.image_url,
                                    full_name: displayName,
                                    challenge_title: cert.challenge_title,
                                  })
                                }}
                                className="absolute top-1 right-1 w-6 h-6 bg-danger/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow"
                                title={th('viewCerts')}
                              >
                                <Siren className="w-3 h-3" />
                              </button>
                            )}

                            {/* 상태 뱃지 */}
                            {cert.dispute_status !== 'clean' && (
                              <div className={`absolute top-1 left-1 text-[8px] font-bold px-1 py-0.5 rounded-full ${
                                cert.dispute_status === 'reviewing' ? 'bg-brand text-white' :
                                cert.dispute_status === 'flagged' ? 'bg-amber text-white' : 'bg-danger text-white'
                              }`}>
                                {cert.dispute_status === 'reviewing' ? '⚖️' : cert.dispute_status === 'flagged' ? '🚨' : '❌'}
                              </div>
                            )}

                            {alreadyDisputed && (
                              <div className="absolute top-1 right-1 bg-gray-600/80 text-white text-[7px] font-bold px-1 py-0.5 rounded-full">{th('filedLabel')}</div>
                            )}

                            {/* 챌린지명 */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-[8px] font-medium truncate">{cert.challenge_title}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {!currentUserId && (
                    <p className="text-xs text-hint mt-3 text-center">
                      <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/hall-of-fame`)}`} className="text-purple font-semibold hover:underline">{th('loginForDispute')}</Link>
                    </p>
                  )}
                  {currentUserId && !canDispute && currentUserId !== profile.id && (
                    <p className="text-xs text-amber mt-3 text-center flex items-center justify-center gap-1">
                      <Siren className="w-3.5 h-3.5" /> {th('disputeRequires3Certs')}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* 이미지 확대 */}
      {expandedImg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setExpandedImg(null)}>
          <img src={expandedImg} alt="" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={() => setExpandedImg(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 text-xl">✕</button>
        </div>
      )}

      {/* 딴지걸기 모달 */}
      {disputeTarget && (
        <DisputeModal
          target={disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onSuccess={(uid, cid) => {
            setLocalDisputedKeys(prev => new Set([...prev, `${uid}_${cid}`]))
            setCertData(prev => prev.map(c =>
              c.challenge_id === cid ? { ...c, already_disputed: true } : c
            ))
          }}
        />
      )}
    </div>
  )
}
