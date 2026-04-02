'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { optimizeImage } from '@/utils/imageOptimizer'
import ChallengeImage from '@/components/ChallengeImage'
import CountryFlag from '@/components/CountryFlag'
import { getCountryByCode } from '@/data/countries'
import Link from 'next/link'
import { Siren, Users, Trash2 } from 'lucide-react'
import type { CommunityCert } from './page'
import DisputeModal, { type DisputeTargetCert } from '@/components/DisputeModal'

// 카테고리 → wish 번역 키 매핑
function getWishKey(category: string): 'wishEat' | 'wishDrink' | 'wishSee' | 'wishGo' {
  if (category === 'foods' || category === 'restaurants') return 'wishEat'
  if (category === 'drinks') return 'wishDrink'
  if (category === 'animals') return 'wishSee'
  return 'wishGo'
}

// 카테고리 → verify 번역 키 매핑
function getVerifyKey(category: string): 'verifyVisit' | 'verifyEat' | 'verifyDrink' | 'verifySee' {
  if (category === 'foods' || category === 'restaurants') return 'verifyEat'
  if (category === 'drinks') return 'verifyDrink'
  if (category === 'animals') return 'verifySee'
  return 'verifyVisit'
}

// 카테고리 → 모달 힌트 번역 키 매핑
function getVerifyHintKey(category: string): 'verifyHintVisit' | 'verifyHintEat' | 'verifyHintDrink' | 'verifyHintSee' {
  if (category === 'foods' || category === 'restaurants') return 'verifyHintEat'
  if (category === 'drinks') return 'verifyHintDrink'
  if (category === 'animals') return 'verifyHintSee'
  return 'verifyHintVisit'
}

interface Challenge {
  id: string
  title_en: string
  title: string
  category: string
  country_code: string | null
  description: string | null
  points: number
}

interface Certification {
  challenge_id: string
  image_url: string
  created_at: string
}

export default function ChallengeClient({
  userId,
  locale,
  challenges,
  initialCertifications,
  initialWishIds = [],
  communityCerts: initialCommCerts = [],
  myCertCount = 0,
}: {
  userId?: string
  locale: string
  challenges: Challenge[]
  initialCertifications: Certification[]
  initialWishIds?: string[]
  communityCerts?: CommunityCert[]
  myCertCount?: number
}) {
  const router = useRouter()
  const t = useTranslations('ChallengesPage')
  const tc = useTranslations('Challenges')
  const [certs, setCerts] = useState<Certification[]>(initialCertifications)
  const [wishIds, setWishIds] = useState<Set<string>>(() => new Set(initialWishIds))
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [search, setSearch] = useState('')

  // 커뮤니티 인증 / 딴지걸기 상태
  const [commCerts, setCommCerts] = useState<CommunityCert[]>(initialCommCerts)
  const [disputeTarget, setDisputeTarget] = useState<DisputeTargetCert | null>(null)
  const [expandedImg, setExpandedImg] = useState<string | null>(null)

  // 챌린지별 인증자 뷰어
  const [certViewChallenge, setCertViewChallenge] = useState<Challenge | null>(null)
  const [certViewData, setCertViewData] = useState<CommunityCert[]>([])
  const [certViewLoading, setCertViewLoading] = useState(false)

  const openCertViewer = async (challenge: Challenge, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!challenge?.id) return
    setCertViewChallenge(challenge)
    setCertViewLoading(true)
    setCertViewData([])
    const challengeId = String(challenge.id)
    try {
      const res = await fetch(`/api/challenges/certs?challengeId=${encodeURIComponent(challengeId)}`)
      const json = await res.json()
      if (!res.ok) {
        setCertViewLoading(false)
        return
      }
      const list = json.data || []
      const result: CommunityCert[] = list.map((c: { user_id: string; challenge_id: string; image_url: string; created_at: string; dispute_status?: string; full_name?: string; avatar_url?: string | null }) => {
        const existing = commCerts.find(cc => cc.user_id === c.user_id && cc.challenge_id === c.challenge_id)
        return {
          user_id: c.user_id,
          challenge_id: c.challenge_id,
          image_url: c.image_url,
          created_at: c.created_at,
          dispute_status: c.dispute_status || 'clean',
          full_name: c.full_name || 'User',
          avatar_url: c.avatar_url ?? null,
          already_disputed: existing?.already_disputed ?? false,
        }
      })
      setCertViewData(result)
    } finally {
      setCertViewLoading(false)
    }
  }

  const markDisputed = (uid: string, cid: string) => {
    setCommCerts(prev => prev.map(c =>
      c.user_id === uid && c.challenge_id === cid ? { ...c, already_disputed: true } : c
    ))
    setCertViewData(prev => prev.map(c =>
      c.user_id === uid && c.challenge_id === cid ? { ...c, already_disputed: true } : c
    ))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedChallenge || !userId) return
    const file = e.target.files[0]
    setUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const optimized = await optimizeImage(file, 'certification')
      const ext = optimized.name.split('.').pop()
      const fileName = `${userId}-${selectedChallenge.id}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(fileName, optimized, { contentType: optimized.type })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('certifications')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('challenge_certifications')
        .insert({
          user_id: userId,
          challenge_id: selectedChallenge.id,
          image_url: publicUrlData.publicUrl,
        })

      if (dbError) throw dbError

      setCerts(prev => [
        ...prev,
        { challenge_id: selectedChallenge.id, image_url: publicUrlData.publicUrl, created_at: new Date().toISOString() },
      ])

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedChallenge(null)
        router.refresh()
      }, 2500)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const toggleWish = async (challengeId: string) => {
    if (!userId) return
    const supabase = createClient()
    const isWished = wishIds.has(challengeId)
    if (isWished) {
      await supabase.from('challenge_wishes').delete().eq('user_id', userId).eq('challenge_id', challengeId)
      setWishIds(prev => { const next = new Set(prev); next.delete(challengeId); return next })
    } else {
      await supabase.from('challenge_wishes').insert({ user_id: userId, challenge_id: challengeId })
      setWishIds(prev => new Set([...prev, challengeId]))
    }
    router.refresh()
  }

  const [deletingCertId, setDeletingCertId] = useState<string | null>(null)
  const deleteCert = async (challengeId: string) => {
    if (!userId) return
    if (!confirm(tc('certCancelConfirm'))) return
    setDeletingCertId(challengeId)
    try {
      const res = await fetch('/api/challenges/certs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || tc('deleteFailed'))
      }
      setCerts(prev => prev.filter(c => c.challenge_id !== challengeId))
      setCommCerts(prev => prev.filter(c => !(c.challenge_id === challengeId && c.user_id === userId)))
      router.refresh()
    } catch (e: any) {
      alert(e.message || tc('certCancelFailed'))
    } finally {
      setDeletingCertId(null)
    }
  }

  const completedIds = new Set(certs.map(c => c.challenge_id))
  const filtered = challenges.filter(c =>
    !search || (c.title ?? c.title_en).toLowerCase().includes(search.toLowerCase()) || c.title_en.toLowerCase().includes(search.toLowerCase())
  )
  const completedCount = challenges.filter(c => completedIds.has(c.id)).length

  return (
    <div>
      {/* Search + Stats bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-edge rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple/50 bg-surface"
          suppressHydrationWarning
        />
        <div className="flex items-center gap-3 text-sm text-subtle shrink-0">
          <span>
            <span className="font-bold text-purple">{completedCount}</span>
            <span className="text-hint"> / {challenges.length} completed</span>
          </span>
          {completedCount > 0 && (
            <span className="bg-purple-light text-purple font-bold px-2.5 py-1 rounded-full text-xs">
              {Math.round((completedCount / challenges.length) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(challenge => {
          const cert = certs.find(c => c.challenge_id === challenge.id)
          const isCompleted = !!cert
          const country = challenge.country_code ? getCountryByCode(challenge.country_code) : null
          // foods, animals, drinks: 어디서나 가능 → 지도/국기 노출 안 함
          const showMapAndFlag = challenge.category !== 'foods' && challenge.category !== 'animals' && challenge.category !== 'drinks'
          // 카테고리별 Google Maps 검색어 힌트: 식당은 'restaurant', 골프장은 'golf course' 추가
          const categoryKeyword: Record<string, string> = {
            restaurants: 'restaurant',
            golf: 'golf course',
            museums: 'museum',
            art_galleries: 'art gallery',
          }
          const hint = categoryKeyword[challenge.category] ?? ''
          const mapsQuery = [challenge.title_en, hint, country?.name].filter(Boolean).join(' ')
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`

          return (
            <div
              key={challenge.id}
              className={`group bg-surface rounded-2xl overflow-hidden border-2 transition-all duration-200 flex flex-col
                ${isCompleted
                  ? 'border-purple/40 shadow-md shadow-purple/20'
                  : 'border-edge hover:border-purple/30 hover:shadow-md'}`}
            >
              {/* ── Photo area ── */}
              <div className="relative">
                <ChallengeImage
                  id={challenge.id}
                  titleEn={challenge.title_en}
                  category={challenge.category}
                  countryCode={challenge.country_code}
                  className="w-full h-44"
                />

                {/* Points badge */}
                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg">
                  +{challenge.points} PT
                </div>

                {/* Flag + completion overlay (foods/animals: 어디서나 가능이라 국기 미표시) */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  {showMapAndFlag && challenge.country_code && (
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      <CountryFlag code={challenge.country_code} size="sm" />
                    </span>
                  )}
                  {isCompleted && (
                    <span className="bg-success text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                      ✓ Done
                    </span>
                  )}
                </div>

                {/* Certified photo overlay */}
                {isCompleted && cert && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <img
                      src={cert.image_url}
                      alt="Your photo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                      <span className="text-white text-xs font-semibold">
                        📅 {new Date(cert.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Card body ── */}
              <div className="flex flex-col flex-1 p-4 gap-2">
                <div>
                  <h3 className="font-bold text-heading text-base leading-snug line-clamp-2">
                    {challenge.title}
                  </h3>
                </div>

                <p className="text-xs text-subtle line-clamp-2 flex-1 leading-relaxed">
                  {challenge.description}
                </p>

                {/* Google Maps 링크 (foods/animals: 어디서나 가능이라 지도 링크 미표시) */}
                {showMapAndFlag && (
                  <div className="mt-1">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-hover hover:underline"
                    >
                      <span>📍</span>
                      <span className="truncate max-w-[180px]">
                        {country ? `${country.name} · ${challenge.title}` : challenge.title}
                      </span>
                    </a>
                  </div>
                )}

                {/* Action */}
                <div className="mt-auto pt-1 flex flex-col gap-1.5">
                  {isCompleted ? (
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-1.5 text-success text-xs font-semibold">
                        <span className="text-base">✅</span>
                        <span>{tc('certified')}</span>
                      </div>
                      {userId && (
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={(e) => { e.stopPropagation(); deleteCert(challenge.id) }}
                          disabled={deletingCertId === challenge.id}
                          className="p-1 rounded-lg text-hint hover:text-danger hover:bg-danger-light disabled:opacity-50 transition-colors"
                          title={tc('certCancel')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      suppressHydrationWarning
                      onClick={() => {
                        if (!userId) { router.push(`/${locale}/login?returnTo=${encodeURIComponent(window.location.pathname)}`); return }
                        setSelectedChallenge(challenge)
                      }}
                      className="w-full py-2 rounded-xl border-2 border-dashed border-purple/30 text-purple text-xs font-bold hover:bg-purple-light hover:border-purple transition-colors"
                    >
                      {t(getVerifyKey(challenge.category))}
                    </button>
                  )}
                  {/* 인증자 보기 버튼 */}
                  {(() => {
                    const count = commCerts.filter(c => c.challenge_id === challenge.id).length
                    return (
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={(e) => openCertViewer(challenge, e)}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-brand hover:bg-brand-light border border-edge-brand hover:border-edge-brand transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {count > 0 ? tc('certCount', { count }) : tc('viewCerts')}
                      </button>
                    )
                  })()}
                  {/* 위시 버튼 */}
                  {userId && (
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => toggleWish(challenge.id)}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        wishIds.has(challenge.id)
                          ? 'bg-gold-light text-gold border border-gold/20'
                          : 'text-hint hover:text-gold hover:bg-gold-light/50 border border-transparent'
                      }`}
                    >
                      {wishIds.has(challenge.id) ? '♥' : '♡'} {t(getWishKey(challenge.category))}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-hint">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-medium">No results for "{search}"</p>
        </div>
      )}

      {/* ── Community Certifications ── */}
      {commCerts.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-extrabold text-heading flex items-center gap-2">
              👥 Community Certifications
            </h2>
            <span className="text-sm text-hint font-normal">{commCerts.length}건</span>
            {!userId && (
              <span className="text-xs text-gold bg-gold-light border border-gold/20 px-2 py-1 rounded-full">{tc('loginForDispute')}</span>
            )}
            {userId && myCertCount < 3 && (
              <span className="text-xs text-gold bg-gold-light border border-gold/20 px-2 py-1 rounded-full flex items-center gap-1"><Siren className="w-3 h-3" /> {tc('disputeRequires3')}</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {commCerts.map(cert => {
              const challenge = challenges.find(c => c.id === cert.challenge_id)
              const canFlag = !cert.already_disputed && cert.dispute_status !== 'reviewing' && cert.dispute_status !== 'invalidated'

              return (
                <div
                  key={`${cert.user_id}-${cert.challenge_id}`}
                  className={`group relative rounded-2xl overflow-hidden bg-surface border-2 shadow-sm hover:shadow-md transition-all ${
                    cert.dispute_status === 'reviewing' ? 'border-edge-brand' :
                    cert.dispute_status === 'flagged' ? 'border-gold/20' :
                    cert.dispute_status === 'invalidated' ? 'border-red-200 opacity-60' :
                    'border-edge hover:border-purple/30'
                  }`}
                >
                  {/* 사진 영역 */}
                  <div
                    className="relative h-36 cursor-zoom-in"
                    onClick={() => setExpandedImg(cert.image_url)}
                  >
                    <img src={cert.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* 내 인증: 취소 아이콘 / 남의 인증: 딴지걸기 아이콘 (hover 시 표시) */}
                    {cert.user_id === userId ? (
                      <button
                        suppressHydrationWarning
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteCert(cert.challenge_id)
                        }}
                        disabled={deletingCertId === cert.challenge_id}
                        className="absolute top-2 right-2 w-8 h-8 bg-gray-600/90 hover:bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:opacity-50"
                        title={tc('certCancel')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : canFlag && (
                      <button
                        suppressHydrationWarning
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!userId) { router.push(`/${locale}/login?returnTo=${encodeURIComponent(window.location.pathname)}`); return }
                          if (myCertCount < 3) { alert(tc('disputeRequires3')); return }
                          setDisputeTarget(cert)
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-danger/90 hover:bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        title={tc('disputeTitle')}
                      >
                        <Siren className="w-4 h-4" />
                      </button>
                    )}

                    {/* 이미 딴지 건 표시 */}
                    {cert.already_disputed && (
                      <div className="absolute top-2 right-2 bg-gray-600/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {tc('disputeFiled')}
                      </div>
                    )}

                    {/* 상태 뱃지 */}
                    {cert.dispute_status !== 'clean' && (
                      <div className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        cert.dispute_status === 'reviewing' ? 'bg-brand text-white' :
                        cert.dispute_status === 'flagged' ? 'bg-gold text-white' :
                        'bg-danger text-white'
                      }`}>
                        {cert.dispute_status === 'reviewing' ? `⚖️ ${tc('statusReviewing')}` :
                         cert.dispute_status === 'flagged' ? `🚨 ${tc('statusFlagged')}` : `❌ ${tc('statusInvalidated')}`}
                      </div>
                    )}

                    {/* 배심원 심사 링크 */}
                    {cert.dispute_status === 'reviewing' && (
                      <Link
                        href={`/${locale}/challenges/disputes/${cert.user_id}/${cert.challenge_id}`}
                        onClick={e => e.stopPropagation()}
                        className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-bold text-white bg-brand/80 hover:bg-brand-hover/90 py-1 transition-colors"
                      >
                        ⚖️ {tc('juryJoin')}
                      </Link>
                    )}

                    {/* 유저 정보 */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-purple-light flex items-center justify-center">
                        {cert.avatar_url
                          ? <img src={cert.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[9px] font-bold text-purple">{cert.full_name[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <p className="text-white text-[10px] font-semibold truncate">{cert.full_name}</p>
                    </div>
                  </div>

                  {/* 챌린지명 */}
                  {challenge && (
                    <p className="text-[11px] font-medium text-body px-2.5 py-2 truncate">
                      {challenge.title || challenge.title_en}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 챌린지별 인증자 뷰어 모달 ── */}
      {certViewChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCertViewChallenge(null)} />
          <div className="relative bg-surface rounded-3xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-edge flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-extrabold text-heading text-lg">{certViewChallenge.title || certViewChallenge.title_en}</h2>
                <p className="text-sm text-subtle mt-0.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {certViewLoading ? tc('loading') : tc('certifiedCount', { count: certViewData.length })}
                </p>
              </div>
              <button suppressHydrationWarning onClick={() => setCertViewChallenge(null)} className="w-8 h-8 bg-surface-sunken rounded-full flex items-center justify-center hover:bg-surface-hover">✕</button>
            </div>
            <div className="overflow-y-auto p-6">
              {certViewLoading ? (
                <div className="text-center py-12 text-hint">
                  <div className="w-8 h-8 border-2 border-purple/60 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  {tc('loading')}
                </div>
              ) : certViewData.length === 0 ? (
                <div className="text-center py-12 text-hint">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  {tc('noCertsYet')}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {certViewData.map(cert => {
                    const canFlag = cert.user_id !== userId && !cert.already_disputed && cert.dispute_status !== 'reviewing' && cert.dispute_status !== 'invalidated'
                    return (
                      <div key={`${cert.user_id}-${cert.challenge_id}`} className="group relative rounded-2xl overflow-hidden border border-edge hover:border-purple/30 shadow-sm hover:shadow-md transition-all">
                        <div className="relative h-36 cursor-zoom-in" onClick={() => setExpandedImg(cert.image_url)}>
                          <img src={cert.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          {/* 상태 뱃지 */}
                          {cert.dispute_status !== 'clean' && (
                            <div className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              cert.dispute_status === 'reviewing' ? 'bg-brand text-white' :
                              cert.dispute_status === 'flagged' ? 'bg-gold text-white' : 'bg-danger text-white'
                            }`}>
                              {cert.dispute_status === 'reviewing' ? `⚖️ ${tc('statusReviewing')}` : cert.dispute_status === 'flagged' ? `🚨 ${tc('statusFlagged')}` : `❌ ${tc('statusInvalidated')}`}
                            </div>
                          )}
                          {/* 내 인증: 취소 / 남의 인증: 딴지걸기 */}
                          {cert.user_id === userId ? (
                            <button
                              suppressHydrationWarning
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteCert(cert.challenge_id)
                                setCertViewData(prev => prev.filter(c => !(c.user_id === cert.user_id && c.challenge_id === cert.challenge_id)))
                              }}
                              disabled={deletingCertId === cert.challenge_id}
                              className="absolute top-2 right-2 w-8 h-8 bg-gray-600/90 hover:bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:opacity-50"
                              title={tc('certCancel')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : canFlag ? (
                            <button
                              suppressHydrationWarning
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!userId) { router.push(`/${locale}/login?returnTo=${encodeURIComponent(window.location.pathname)}`); return }
                                if (myCertCount < 3) { alert(tc('disputeRequires3')); return }
                                setDisputeTarget({
                                  user_id: cert.user_id,
                                  challenge_id: cert.challenge_id,
                                  image_url: cert.image_url,
                                  full_name: cert.full_name,
                                  challenge_title: certViewChallenge.title || certViewChallenge.title_en,
                                })
                              }}
                              className="absolute top-2 right-2 w-8 h-8 bg-danger/90 hover:bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                              title={tc('disputeTitle')}
                            >
                              <Siren className="w-4 h-4" />
                            </button>
                          ) : null}
                          {cert.already_disputed && (
                            <div className="absolute top-2 right-2 bg-gray-600/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{tc('disputeFiled')}</div>
                          )}
                          {cert.dispute_status === 'reviewing' && (
                            <Link href={`/${locale}/challenges/disputes/${cert.user_id}/${cert.challenge_id}`} onClick={e => e.stopPropagation()} className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-bold text-white bg-brand/80 hover:bg-brand-hover/90 py-1 transition-colors">
                              ⚖️ {tc('juryJoin')}
                            </Link>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-purple-light flex items-center justify-center">
                              {cert.avatar_url
                                ? <img src={cert.avatar_url} alt="" className="w-full h-full object-cover" />
                                : <span className="text-[9px] font-bold text-purple">{cert.full_name[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <p className="text-white text-[10px] font-semibold truncate">{cert.full_name}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-hint px-2.5 py-1.5">
                          {new Date(cert.created_at).toLocaleDateString(locale)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 딴지걸기 모달 (공유 컴포넌트) ── */}
      {disputeTarget && (
        <DisputeModal
          target={disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onSuccess={markDisputed}
        />
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
            suppressHydrationWarning
            onClick={() => setExpandedImg(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 text-xl"
          >✕</button>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !uploading && setSelectedChallenge(null)}
          />
          <div className="relative bg-surface rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
            {/* Header image */}
            <div className="relative h-36">
              <ChallengeImage
                id={selectedChallenge.id}
                titleEn={selectedChallenge.title_en}
                category={selectedChallenge.category}
                countryCode={selectedChallenge.country_code}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{t('verifyModal')}</p>
                  <h3 className="text-white font-bold text-lg leading-tight">{selectedChallenge.title}</h3>
                </div>
              </div>
              <button
                suppressHydrationWarning
                onClick={() => !uploading && setSelectedChallenge(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60"
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-center">
              {showSuccess ? (
                <div className="py-6 animate-in zoom-in duration-300">
                  <div className="text-6xl mb-3">🎊</div>
                  <h3 className="text-2xl font-bold text-heading mb-1">{tc('challengeComplete')}</h3>
                  <p className="text-purple font-bold text-lg">+{selectedChallenge.points} Points Earned</p>
                </div>
              ) : (
                <>
                  {selectedChallenge.description && (
                    <p className="text-sm text-body text-left leading-relaxed mb-4 px-1">
                      {selectedChallenge.description}
                    </p>
                  )}

                  {error && (
                    <div className="text-danger text-sm mb-4 bg-danger-light p-3 rounded-xl">{error}</div>
                  )}

                  <div className="border-2 border-dashed border-purple/30 rounded-2xl p-8 hover:bg-purple-light transition-colors relative cursor-pointer group">
                    <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">📸</div>
                    <div className="text-sm font-bold text-purple">{tc('uploadPhoto')}</div>
                    <div className="text-xs text-hint mt-1">{t(getVerifyHintKey(selectedChallenge.category))}</div>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      onChange={handleUpload}
                      disabled={uploading}
                      suppressHydrationWarning
                    />
                  </div>

                  {uploading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-purple">
                      <div className="w-4 h-4 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                      Uploading and verifying...
                    </div>
                  )}

                  <button
                    suppressHydrationWarning
                    onClick={() => setSelectedChallenge(null)}
                    disabled={uploading}
                    className="mt-5 text-sm text-hint hover:text-body disabled:opacity-50"
                  >
                    {tc('cancel')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
