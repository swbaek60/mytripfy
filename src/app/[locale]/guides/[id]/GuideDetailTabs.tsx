'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Star, Globe, Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import GuideRateDisplay from '@/components/GuideRateDisplay'
import UserChallengeAchievements from '@/components/UserChallengeAchievements'
import SponsorVisitList from '@/components/SponsorVisitList'
import type { SponsorVisitItem } from '@/components/SponsorVisitList'
import { getCountryByCode, getCountryFlagEmoji } from '@/data/countries'
import { getLanguageByCode, getLevelInfo as getLangLevel } from '@/data/languages'

/* ─────── 타입 ─────── */
interface VisitedCountry { country_code: string; country_name?: string | null }
interface ReviewerProfile { id: string; full_name: string | null; avatar_url: string | null }
interface Review {
  id: string; rating: number; content: string | null; tags: string[] | null
  created_at: string; reviewer_id: string; profiles: ReviewerProfile | null
}
interface LanguageSkill { lang: string; level: string }
interface GuideRegion { country: string; cities: string[] }

export interface CertificationItem {
  id: string
  challenge_id: string
  image_url: string | null
  created_at: string
  dispute_status?: string
  challenges: {
    id: string; title_en: string; title_ko: string | null
    category: string; image_url: string | null; points?: number; country_code?: string | null
  } | null
}

type Tab = 'overview' | 'achievements' | 'reviews'

/* ─────── Props ─────── */
interface Props {
  guideId: string
  locale: string
  bio: string | null
  travelCount: number
  trustScore: number | null
  reviewCount: number
  memberSince: string | null
  challengesCompleted: number
  challengePoints: number
  experiencePoints: number
  contributionPoints: number
  certifications: CertificationItem[]
  sponsorVisitList: SponsorVisitItem[]
  currentUserId: string | null
  myCertCount: number
  myDisputedVisitIds: string[]
  disputedKeys: string[]
  profilePhotos: string[]
  guideRate: number | null
  rateCurrency: string | null
  hasVehicle: boolean
  vehicleInfo: string | null
  vehiclePhotos: string[]
  hasAccommodation: boolean
  accommodationInfo: string | null
  accommodationPhotos: string[]
  guideRegions: GuideRegion[]
  guideRegionsLegacy: string[]
  spokenLanguages: LanguageSkill[]
  visitedCountries: VisitedCountry[]
  reviews: Review[]
}

/* ─────── 컴포넌트 ─────── */
export default function GuideDetailTabs({
  guideId, locale, bio, trustScore,
  memberSince, challengesCompleted, challengePoints, experiencePoints, contributionPoints,
  certifications, sponsorVisitList, currentUserId, myCertCount, myDisputedVisitIds, disputedKeys,
  profilePhotos,
  guideRate, rateCurrency, hasVehicle, vehicleInfo, vehiclePhotos,
  hasAccommodation, accommodationInfo, accommodationPhotos,
  guideRegions, guideRegionsLegacy, spokenLanguages, visitedCountries, reviews,
}: Props) {
  const t = useTranslations('Guides')
  const tg = useTranslations('GuideDetail')
  const tc = useTranslations('Common')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [photoIndex, setPhotoIndex] = useState<number | null>(null)

  const certTitle = (c: CertificationItem) =>
    locale.startsWith('ko') && c.challenges?.title_ko ? c.challenges.title_ko : (c.challenges?.title_en ?? '')

  const hasHof = challengesCompleted > 0 || experiencePoints > 0 || contributionPoints > 0 || sponsorVisitList.length > 0
  const hofSub = hasHof
    ? `${t('expPoints')} ${experiencePoints} · ${t('contribPoints')} ${contributionPoints}`
    : undefined

  const tabs: { id: Tab; icon: React.ReactNode; label: string; sub?: string }[] = [
    { id: 'overview',      icon: <Globe className="w-4 h-4" />,   label: t('tabOverview') },
    { id: 'achievements',  icon: <Trophy className="w-4 h-4" />,  label: t('tabAchievements'), sub: hofSub },
    { id: 'reviews',       icon: <Star className="w-4 h-4" />,    label: t('tabReviews'),
      sub: reviews.length > 0 ? `${trustScore ? Number(trustScore).toFixed(1) : '—'} (${reviews.length})` : reviews.length > 0 ? `${reviews.length}` : undefined },
  ]

  return (
    <div className="space-y-5">
      {/* ── 탭 네비게이션 ── */}
      <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-edge">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3.5 gap-0.5 transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-hover bg-brand-light border-b-2 border-brand'
                  : 'text-subtle hover:bg-surface-hover'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-brand' : 'text-hint'}>{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.sub && (
                <span className={`text-xs font-bold ${activeTab === tab.id ? 'text-brand-hover' : 'text-body'}`}>
                  {tab.sub}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ══════════════════════════════
              Overview 탭
          ══════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* About */}
              {bio && (
                <div>
                  <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-2">{tg('about')}</h3>
                  <p className="text-body leading-relaxed">{bio}</p>
                </div>
              )}

              {/* Quick Stats */}
              <div>
                <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-3">{tg('quickStats')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <div className="font-bold text-amber-700 text-lg">{challengePoints}</div>
                      <div className="text-xs text-amber-600">{tg('challengePoints')}</div>
                    </div>
                  </div>
                  <div className="bg-purple-light rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-bold text-purple text-lg">{challengesCompleted}</div>
                      <div className="text-xs text-purple">{tg('challengesDone')}</div>
                    </div>
                  </div>
                  <div className="bg-brand-light rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <div className="font-bold text-brand-hover text-lg">{visitedCountries.length}</div>
                      <div className="text-xs text-brand">{tg('countriesVisited')}</div>
                    </div>
                  </div>
                  {trustScore && trustScore > 0 ? (
                    <div className="bg-warning-light rounded-xl p-3 flex items-center gap-3">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <div className="font-bold text-yellow-700 text-lg">{Number(trustScore).toFixed(1)}</div>
                        <div className="text-xs text-yellow-600">{tg('averageRating')}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-warning-light rounded-xl p-3 flex items-center gap-3">
                      <span className="text-2xl">💬</span>
                      <div>
                        <div className="font-bold text-yellow-700 text-lg">{reviews.length}</div>
                        <div className="text-xs text-yellow-600">{tg('reviews')}</div>
                      </div>
                    </div>
                  )}
                  {memberSince && (
                    <div className="bg-surface-sunken rounded-xl p-3 flex items-center gap-3 col-span-2">
                      <span className="text-2xl">📅</span>
                      <div>
                        <div className="font-bold text-body text-sm">
                          {new Date(memberSince).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-xs text-subtle">{tg('memberSince')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 언어 */}
              {spokenLanguages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-3">{tg('languages')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {spokenLanguages.map(skill => {
                      const lang = getLanguageByCode(skill.lang)
                      const lvl = getLangLevel(skill.level)
                      return lang ? (
                        <div key={skill.lang} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${lvl.bgColor}`}>
                          <span className="text-base">{lang.emoji}</span>
                          <div>
                            <div className="text-sm font-semibold text-heading">{lang.name}</div>
                            <div className={`text-xs font-medium ${lvl.textColor}`}>
                              {'★'.repeat(lvl.stars)}{'☆'.repeat(5 - lvl.stars)}
                            </div>
                          </div>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* 방문한 나라들 */}
              {visitedCountries.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-3">
                    Countries Visited ({visitedCountries.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {visitedCountries.map(vc => {
                      const c = getCountryByCode(vc.country_code)
                      const flag = c ? c.emoji : getCountryFlagEmoji(vc.country_code)
                      return (
                        <div key={vc.country_code}
                          className="flex items-center gap-2 px-3 py-2 bg-brand-light border border-edge-brand rounded-xl">
                          <span className="text-lg leading-none shrink-0">{flag}</span>
                          <span className="text-sm font-medium text-heading truncate">
                            {c?.name || vc.country_name || '–'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 프로필 사진 갤러리 */}
              {profilePhotos.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-3">{tg('photos')}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {profilePhotos.map((url, i) => (
                      <button key={i} onClick={() => setPhotoIndex(i)}
                        className="aspect-square rounded-xl overflow-hidden bg-surface-sunken hover:opacity-90 transition-opacity">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 가이드 서비스 */}
              <div>
                <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-3">{tg('guideServices')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-sm font-medium text-body">{tg('hourlyRate')}</span>
                    </div>
                    <GuideRateDisplay rate={guideRate} rateCurrency={rateCurrency} size="lg" />
                  </div>
                  {hasVehicle && (
                    <div className="flex items-center gap-3 p-3.5 bg-brand-light rounded-xl border border-edge-brand">
                      <span className="text-xl">🚗</span>
                      <div>
                        <div className="text-sm font-medium text-body">{tg('vehicleIncluded')}</div>
                        {vehicleInfo && <div className="text-xs text-subtle mt-0.5">{vehicleInfo}</div>}
                      </div>
                    </div>
                  )}
                  {hasAccommodation && (
                    <div className="flex items-center gap-3 p-3.5 bg-success-light rounded-xl border border-green-100">
                      <span className="text-xl">🏠</span>
                      <div>
                        <div className="text-sm font-medium text-body">{tg('accommodationIncluded')}</div>
                        {accommodationInfo && <div className="text-xs text-subtle mt-0.5">{accommodationInfo}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 활동 지역 */}
              {(guideRegions.length > 0 || guideRegionsLegacy.length > 0) && (
                <div>
                  <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-3">{tg('guideAreas')}</h3>
                  <div className="space-y-2">
                    {guideRegions.length > 0
                      ? guideRegions.map(region => {
                          const c = getCountryByCode(region.country)
                          const flag = c ? c.emoji : getCountryFlagEmoji(region.country)
                          return (
                            <div key={region.country} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{flag}</span>
                                <span className="font-semibold text-sm text-heading">{c?.name || '–'}</span>
                              </div>
                              {region.cities.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {region.cities.map(city => (
                                    <span key={city} className="text-xs bg-surface border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full font-medium">
                                      📍 {city}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-amber-700 bg-surface border border-amber-200 px-2.5 py-1 rounded-full">
                                  🗺️ {tc('nationwide')}
                                </span>
                              )}
                            </div>
                          )
                        })
                      : guideRegionsLegacy.map(code => {
                          const c = getCountryByCode(code)
                          const flag = c ? c.emoji : getCountryFlagEmoji(code)
                          return (
                            <div key={code} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{flag}</span>
                                <span className="font-semibold text-sm text-heading">{c?.name || '–'}</span>
                              </div>
                              <span className="text-xs text-amber-700 bg-surface border border-amber-200 px-2.5 py-1 rounded-full">
                                🗺️ {tc('nationwide')}
                              </span>
                            </div>
                          )
                        })
                    }
                  </div>
                </div>
              )}

              {/* 차량/숙소 사진 */}
              {vehiclePhotos.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-3">{tg('vehiclePhotos')}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {vehiclePhotos.map((url, i) => (
                      <div key={i} className="w-28 h-20 rounded-xl overflow-hidden bg-surface-sunken shrink-0">
                        <img src={url} alt={`Vehicle ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {accommodationPhotos.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-hint uppercase tracking-wide mb-3">{tg('accommodationPhotos')}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {accommodationPhotos.map((url, i) => (
                      <div key={i} className="w-28 h-20 rounded-xl overflow-hidden bg-surface-sunken shrink-0">
                        <img src={url} alt={`Accommodation ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════
              Hall of Fame 탭 (회원 프로필과 동일: 경험·기여·챌린지·스폰서 방문)
          ══════════════════════════════ */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <UserChallengeAchievements
                userId={guideId}
                certifications={certifications}
                challengePoints={challengePoints}
                experiencePoints={experiencePoints}
                contributionPoints={contributionPoints}
                locale={locale}
                currentUserId={currentUserId}
                myCertCount={myCertCount}
                disputedKeys={new Set(disputedKeys)}
              />
              <SponsorVisitList
                visits={sponsorVisitList}
                locale={locale}
                isOwnProfile={false}
                currentUserId={currentUserId}
                myCertCount={myCertCount}
                myDisputedVisitIds={new Set(myDisputedVisitIds)}
              />
              {certifications.length === 0 && sponsorVisitList.length === 0 && (
                <div className="text-center py-12 text-hint">
                  <div className="text-5xl mb-3">🏆</div>
                  <p className="font-medium text-subtle">{t('noCertificationsYet')}</p>
                  <p className="text-sm mt-1">{t('noCertificationsDesc')}</p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════
              Reviews 탭
          ══════════════════════════════ */}
          {activeTab === 'reviews' && (
            <div>
              {/* 평점 요약 */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-warning-light rounded-2xl border border-yellow-100 mb-5">
                  <div className="text-center min-w-[60px]">
                    {trustScore && trustScore > 0 ? (
                      <>
                        <div className="text-4xl font-extrabold text-yellow-600">{Number(trustScore).toFixed(1)}</div>
                        <div className="text-yellow-500 text-base mt-0.5">
                          {'★'.repeat(Math.round(trustScore))}{'☆'.repeat(5 - Math.round(trustScore))}
                        </div>
                      </>
                    ) : (
                      <div className="text-3xl">⭐</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-body mb-1.5">{reviews.length} {tg('reviews').toLowerCase()}</div>
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length
                      const pct = (count / reviews.length) * 100
                      return (
                        <div key={star} className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-yellow-500 w-3 text-right">{star}</span>
                          <div className="flex-1 h-1.5 bg-yellow-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-hint w-4">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map(review => {
                    const reviewer = review.profiles
                    return (
                      <div key={review.id} className="bg-surface-sunken rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {reviewer?.avatar_url
                              ? <img src={reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <span className="text-lg">👤</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                {reviewer?.id
                                  ? <Link href={`/${locale}/users/${reviewer.id}`}
                                      className="font-semibold text-heading hover:text-brand transition-colors text-sm">
                                      {reviewer.full_name || tc('anonymous')}
                                    </Link>
                                  : <span className="font-semibold text-heading text-sm">{tc('anonymous')}</span>
                                }
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-yellow-400 text-sm leading-none">
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                  </span>
                                  <span suppressHydrationWarning className="text-xs text-hint">
                                    {new Date(review.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {review.tags && review.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {review.tags.map(tag => (
                                  <span key={tag} className="text-xs bg-brand-light text-brand border border-edge-brand px-2 py-0.5 rounded-full">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {review.content && (
                              <p className="text-sm text-body mt-2 leading-relaxed">{review.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-hint">
                  <div className="text-5xl mb-3">⭐</div>
                  <p className="font-medium text-subtle">{tg('noReviewsYet')}</p>
                  <p className="text-sm mt-1">{tg('beFirstReview')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 사진 라이트박스 */}
      {photoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPhotoIndex(null)}>
          <img src={profilePhotos[photoIndex]} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
            onClick={() => setPhotoIndex(null)}>✕</button>
          {photoIndex > 0 && (
            <button onClick={e => { e.stopPropagation(); setPhotoIndex(photoIndex - 1) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/30">‹</button>
          )}
          {photoIndex < profilePhotos.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setPhotoIndex(photoIndex + 1) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/30">›</button>
          )}
        </div>
      )}
    </div>
  )
}
