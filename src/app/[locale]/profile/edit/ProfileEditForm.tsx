'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COUNTRIES, TRAVEL_LEVELS } from '@/data/countries'
import { CURRENCIES } from '@/utils/currency'
import Link from 'next/link'
import AvatarUpload from '@/components/AvatarUpload'
import ProfilePhotos from '@/components/ProfilePhotos'
import GuideMediaUpload from '@/components/GuideMediaUpload'
import LanguageSkillPicker from '@/components/LanguageSkillPicker'
import GuideRegionPicker from '@/components/GuideRegionPicker'
import CountrySelect from '@/components/CountrySelect'
import { getPersonalityDisplay } from '@/data/personalityTypes'
import type { LanguageSkill } from '@/data/languages'
import type { GuideRegion } from '@/data/cities'

interface Props {
  profile: Record<string, unknown> | null
  userId: string
  locale: string
  visitedCodes: string[]
  certifiedCountryCodes?: string[]
  wishedCountryCodes?: string[]
  initialPhotos?: string[]
  travelPersonality?: { personality_type: string; personality_desc: string | null } | null
}

type TabId = 'basic' | 'guide' | 'language' | 'contact' | 'visited'

export default function ProfileEditForm({
  profile, userId, locale,
  visitedCodes: initialCodes,
  certifiedCountryCodes = [],
  wishedCountryCodes = [],
  initialPhotos = [],
  travelPersonality = null,
}: Props) {
  const t = useTranslations('ProfileEdit')
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('basic')

  const [avatarUrl, setAvatarUrl] = useState((profile?.avatar_url as string) || '')
  const [profilePhotos, setProfilePhotos] = useState<string[]>(initialPhotos)

  const [fullName, setFullName] = useState((profile?.full_name as string) || '')
  const [gender, setGender] = useState((profile?.gender as string) || '')
  const [birthYear, setBirthYear] = useState((profile?.birth_year as number) || 0)
  const [nationality, setNationality] = useState((profile?.nationality as string) || '')
  const [bio, setBio] = useState((profile?.bio as string) || '')

  const [instagram, setInstagram] = useState((profile?.instagram_url as string) || '')
  const [facebook, setFacebook] = useState((profile?.facebook_url as string) || '')
  const [twitter, setTwitter] = useState((profile?.twitter_url as string) || '')
  const [whatsapp, setWhatsapp] = useState((profile?.whatsapp as string) || '')
  const [telegram, setTelegram] = useState((profile?.telegram as string) || '')
  const [lineId, setLineId] = useState((profile?.line_id as string) || '')

  const [isGuide, setIsGuide] = useState((profile?.is_guide as boolean) || false)
  const [guideRate, setGuideRate] = useState((profile?.guide_hourly_rate as number) || 0)
  const [rateCurrency, setRateCurrency] = useState((profile?.rate_currency as string) || 'USD')
  const [hasVehicle, setHasVehicle] = useState((profile?.guide_has_vehicle as boolean) || false)
  const [vehicleInfo, setVehicleInfo] = useState((profile?.guide_vehicle_info as string) || '')
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>((profile?.guide_vehicle_photos as string[]) || [])
  const [hasAccommodation, setHasAccommodation] = useState((profile?.guide_has_accommodation as boolean) || false)
  const [accommodationInfo, setAccommodationInfo] = useState((profile?.guide_accommodation_info as string) || '')
  const [accommodationPhotos, setAccommodationPhotos] = useState<string[]>((profile?.guide_accommodation_photos as string[]) || [])
  const [guideRegions, setGuideRegions] = useState<GuideRegion[]>(() => {
    const existing = profile?.guide_city_regions as GuideRegion[] | null
    if (existing && existing.length > 0) return existing
    const oldRegions = profile?.guide_regions as string[] | null
    if (oldRegions && oldRegions.length > 0) return oldRegions.map(code => ({ country: code, cities: [] }))
    return []
  })

  const [spokenLanguages, setSpokenLanguages] = useState<LanguageSkill[]>(
    (profile?.spoken_languages as LanguageSkill[]) || []
  )

  const [visitedCodes, setVisitedCodes] = useState<string[]>(initialCodes)
  const [countrySearch, setCountrySearch] = useState('')

  const filteredCountries = COUNTRIES.filter(c =>
    countrySearch.length > 0 &&
    (c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
     c.code.toLowerCase().includes(countrySearch.toLowerCase()))
  ).slice(0, 10)

  const toggleCountry = async (code: string) => {
    const supabase = createClient()
    if (visitedCodes.includes(code)) {
      await supabase.from('visited_countries').delete().eq('user_id', userId).eq('country_code', code)
      setVisitedCodes(prev => prev.filter(c => c !== code))
    } else {
      const country = COUNTRIES.find(c => c.code === code)
      await supabase.from('visited_countries').insert({ user_id: userId, country_code: code, country_name: country?.name })
      setVisitedCodes(prev => [...prev, code])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const supabase = createClient()

    const emptyToNull = (v: string | number) => (v === '' || v === 0 ? null : v)
    const basePayload = {
      id: userId,
      full_name: fullName.trim() || null,
      gender: gender || null,
      birth_year: emptyToNull(birthYear) as number | null,
      nationality: nationality.trim() || null,
      bio: bio.trim() || null,
      instagram_url: instagram.trim() || null,
      facebook_url: facebook.trim() || null,
      twitter_url: twitter.trim() || null,
      whatsapp: whatsapp.trim() || null,
      telegram: telegram.trim() || null,
      line_id: lineId.trim() || null,
      is_guide: isGuide,
      guide_hourly_rate: isGuide ? guideRate : null,
      rate_currency: isGuide ? (rateCurrency || 'USD') : 'USD',
      guide_has_vehicle: isGuide ? hasVehicle : false,
      guide_vehicle_info: isGuide && hasVehicle ? (vehicleInfo.trim() || null) : null,
      guide_vehicle_photos: isGuide && hasVehicle ? vehiclePhotos : [],
      guide_has_accommodation: isGuide ? hasAccommodation : false,
      guide_accommodation_info: isGuide && hasAccommodation ? (accommodationInfo.trim() || null) : null,
      guide_accommodation_photos: isGuide && hasAccommodation ? accommodationPhotos : [],
      guide_regions: isGuide && guideRegions.length > 0 ? guideRegions.map(r => r.country) : null,
      guide_city_regions: isGuide && guideRegions.length > 0 ? guideRegions : [],
      spoken_languages: spokenLanguages.length > 0 ? spokenLanguages : [],
      updated_at: new Date().toISOString(),
    }

    let { error } = await supabase.from('profiles').upsert(basePayload)

    if (error && error.message?.includes('guide_city_regions')) {
      const { guide_city_regions: _removed, ...fallbackPayload } = basePayload
      const result = await supabase.from('profiles').upsert(fallbackPayload)
      error = result.error
    }

    setSaving(false)
    if (error) {
      setMessage('❌ ' + t('saveError') + error.message)
    } else {
      setMessage('✅ ' + t('saveSuccess'))
      startTransition(() => router.refresh())
    }
  }

  const totalVisitedCount = new Set([...visitedCodes, ...certifiedCountryCodes]).size
  const currentLevel = TRAVEL_LEVELS.find(l =>
    totalVisitedCount >= l.minCountries && totalVisitedCount <= l.maxCountries
  ) || TRAVEL_LEVELS[0]

  const years = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 10 - i)

  const TABS: { id: TabId; label: string }[] = [
    { id: 'basic',    label: t('tab_basic')    },
    { id: 'guide',    label: t('tab_guide')    },
    { id: 'language', label: t('tab_language') },
    { id: 'contact',  label: t('tab_contact')  },
    { id: 'visited',  label: t('tab_visited')  },
  ]

  return (
    <div className="space-y-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-heading">{t('title')}</h1>
        <Link href={`/${locale}/profile`}>
          <Button variant="ghost" className="text-subtle">{t('goBack')}</Button>
        </Link>
      </div>

      {/* 탭 바 */}
      <div className="bg-surface rounded-2xl shadow-sm">
        <div className="overflow-x-auto rounded-t-2xl overflow-hidden">
          <div className="flex min-w-max border-b border-edge">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const badge = tab.id === 'guide'
                ? (isGuide ? t('badge_active') : null)
                : tab.id === 'language'
                  ? (spokenLanguages.length > 0 ? spokenLanguages.length : null)
                  : tab.id === 'visited'
                    ? (totalVisitedCount > 0 ? totalVisitedCount : null)
                    : null
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-brand-hover bg-brand-light border-b-2 border-brand'
                      : 'text-hint hover:text-body hover:bg-surface-hover'
                  }`}
                >
                  {tab.label}
                  {badge !== null && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                      isActive ? 'bg-brand-muted text-brand-hover' : 'bg-surface-sunken text-subtle'
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 탭 콘텐츠 - overflow visible (드롭다운이 바깥으로 나올 수 있도록) */}
        <div className="p-6 overflow-visible">

          {/* ── 탭 1: 기본 정보 ── */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-body mb-3">
                  {t('photo_label')}
                  <span className="text-xs font-normal text-hint"> — {t('photo_desc')}</span>
                </p>
                <div className="flex justify-center py-2 mb-4">
                  <AvatarUpload userId={userId} currentUrl={avatarUrl} onUpload={setAvatarUrl} />
                </div>
                <div className="border-t border-edge pt-4">
                  <ProfilePhotos userId={userId} initialPhotos={profilePhotos} onUpdate={setProfilePhotos} />
                </div>
              </div>
              <div className="border-t border-edge" />
              <Field label={t('field_name')}>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('field_name_placeholder')} />
              </Field>
              <Field label={t('field_gender')}>
                <select value={gender} onChange={e => setGender(e.target.value)}
                  className="w-full h-10 rounded-md border border-edge px-3 text-sm bg-surface">
                  <option value="">{t('gender_none')}</option>
                  <option value="male">{t('gender_male')}</option>
                  <option value="female">{t('gender_female')}</option>
                  <option value="other">{t('gender_other')}</option>
                  <option value="prefer_not_to_say">{t('gender_prefer_not')}</option>
                </select>
              </Field>
              <Field label={t('field_birth_year')}>
                <select value={birthYear} onChange={e => setBirthYear(Number(e.target.value))}
                  className="w-full h-10 rounded-md border border-edge px-3 text-sm bg-surface">
                  <option value={0}>{t('year_none')}</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label={t('field_nationality')}>
                <CountrySelect
                  value={nationality}
                  onChange={setNationality}
                  placeholder={t('nationality_placeholder')}
                />
              </Field>
              <Field label={t('field_bio')}>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder={t('bio_placeholder')}
                  rows={4}
                  className="w-full rounded-md border border-edge px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </Field>

              {/* Travel Personality Test */}
              <div className="border-t border-edge pt-5">
                <p className="text-sm font-semibold text-body mb-2">
                  {locale.startsWith('ko') ? '여행 성향 테스트' : 'Travel Personality Test'}
                </p>
                {travelPersonality ? (
                  <div className="rounded-xl p-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl shrink-0">{getPersonalityDisplay(travelPersonality.personality_type)?.emoji ?? '🌍'}</span>
                      <div>
                        <p className="font-semibold text-heading">
                          {getPersonalityDisplay(travelPersonality.personality_type)?.type ?? travelPersonality.personality_type}
                        </p>
                        {(travelPersonality.personality_desc || getPersonalityDisplay(travelPersonality.personality_type)?.desc) && (
                          <p className="text-sm text-body mt-0.5">
                            {travelPersonality.personality_desc || getPersonalityDisplay(travelPersonality.personality_type)?.desc}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href={`/${locale}/personality`} className="inline-block mt-3 text-sm font-medium text-violet-600 hover:text-violet-700">
                      {locale.startsWith('ko') ? '다시 테스트하기 →' : 'Retake test →'}
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-subtle mb-2">
                    {locale.startsWith('ko') ? '8가지 질문으로 나의 여행 스타일을 알아보세요.' : 'Answer 8 questions to discover your travel style.'}
                  </p>
                )}
                <Link href={`/${locale}/personality`}>
                  <Button type="button" variant="outline" className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 mt-1">
                    {travelPersonality ? (locale.startsWith('ko') ? '여행 성향 테스트' : 'Travel Personality Test') : (locale.startsWith('ko') ? '테스트 하러 가기 →' : 'Take the test →')}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* ── 탭 2: 가이드 설정 ── */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className={`rounded-2xl p-5 border-2 transition-all ${
                isGuide
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
                  : 'bg-gradient-to-br from-slate-50 to-gray-50 border-edge'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${isGuide ? 'bg-amber-100 text-amber' : 'bg-surface-sunken text-hint'}`}>
                      {isGuide ? '✓' : '·'}
                    </div>
                    <div>
                      <p className={`font-semibold ${isGuide ? 'text-amber-900' : 'text-body'}`}>
                        {isGuide ? t('guide_toggle_on') : t('guide_toggle_off')}
                      </p>
                      <p className={`text-xs mt-0.5 ${isGuide ? 'text-amber-700' : 'text-hint'}`}>
                        {isGuide ? t('guide_hint_on') : t('guide_hint_off')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGuide(v => !v)}
                    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                      isGuide ? 'bg-amber-light0' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-surface shadow-md transition-transform ${
                      isGuide ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {!isGuide && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-subtle">
                    {[t('guide_benefit_1'), t('guide_benefit_2'), t('guide_benefit_3'), t('guide_benefit_4')].map(text => (
                      <div key={text} className="bg-surface/70 rounded-lg px-3 py-2 border border-edge">
                        {text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isGuide && (
                <>
                  <Field label={t('guide_rate_label')}>
                    <div className="flex gap-2">
                      <select
                        value={rateCurrency}
                        onChange={e => setRateCurrency(e.target.value)}
                        className="border border-edge rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-amber-400 shrink-0"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={0}
                        value={guideRate}
                        onChange={e => setGuideRate(Number(e.target.value))}
                        placeholder={t('guide_rate_free')}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-hint mt-1">{t('guide_rate_hint')}</p>
                  </Field>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-body">{t('guide_services')}</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-surface-sunken rounded-xl cursor-pointer hover:bg-amber-light transition-colors">
                        <input type="checkbox" checked={hasVehicle} onChange={e => setHasVehicle(e.target.checked)}
                          className="w-4 h-4 accent-amber-500" />
                        <span className="text-sm font-medium text-body">{t('guide_vehicle_check')}</span>
                      </label>
                      {hasVehicle && (
                        <div className="space-y-2 pl-4 border-l-2 border-amber-200">
                          <Input value={vehicleInfo} onChange={e => setVehicleInfo(e.target.value)}
                            placeholder={t('guide_vehicle_placeholder')} />
                          <GuideMediaUpload userId={userId} bucket="guide-media" folder="vehicle"
                            initialPhotos={vehiclePhotos} label={t('guide_vehicle_photos')} onUpdate={setVehiclePhotos} />
                        </div>
                      )}

                      <label className="flex items-center gap-3 p-3 bg-surface-sunken rounded-xl cursor-pointer hover:bg-amber-light transition-colors">
                        <input type="checkbox" checked={hasAccommodation} onChange={e => setHasAccommodation(e.target.checked)}
                          className="w-4 h-4 accent-amber-500" />
                        <span className="text-sm font-medium text-body">{t('guide_accommodation_check')}</span>
                      </label>
                      {hasAccommodation && (
                        <div className="space-y-2 pl-4 border-l-2 border-amber-200">
                          <Input value={accommodationInfo} onChange={e => setAccommodationInfo(e.target.value)}
                            placeholder={t('guide_accommodation_placeholder')} />
                          <GuideMediaUpload userId={userId} bucket="guide-media" folder="accommodation"
                            initialPhotos={accommodationPhotos} label={t('guide_accommodation_photos')} onUpdate={setAccommodationPhotos} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-body mb-1">{t('guide_region_label')}</p>
                    <p className="text-xs text-hint mb-3">{t('guide_region_hint')}</p>
                    <GuideRegionPicker value={guideRegions} onChange={setGuideRegions} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── 탭 3: 언어 ── */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-body mb-1">{t('lang_title')}</p>
                <p className="text-xs text-hint mb-4">{t('lang_desc')}</p>
                <LanguageSkillPicker value={spokenLanguages} onChange={setSpokenLanguages} maxItems={10} />
              </div>
            </div>
          )}

          {/* ── 탭 4: 연락처 ── */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <p className="text-xs text-hint">{t('contact_notice')}</p>
              <Field label="Instagram URL">
                <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/username" />
              </Field>
              <Field label="Facebook URL">
                <Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/username" />
              </Field>
              <Field label="X (Twitter) URL">
                <Input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://x.com/username" />
              </Field>
              <Field label="WhatsApp">
                <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+1 234 567 8900" />
              </Field>
              <Field label="Telegram ID">
                <Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" />
              </Field>
              <Field label="Line ID">
                <Input value={lineId} onChange={e => setLineId(e.target.value)} placeholder="line_id" />
              </Field>
            </div>
          )}

          {/* ── 탭 5: 방문 국가 ── */}
          {activeTab === 'visited' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-body mb-2">{t('visited_title')}</h3>
                <p className="text-xs text-subtle mb-2">{t('visited_desc')}</p>
                <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ backgroundColor: currentLevel.color + '20' }}>
                  <span className="text-3xl">{currentLevel.badge}</span>
                  <div>
                    <div className="font-bold text-heading">Lv.{currentLevel.level} {currentLevel.titleKo}</div>
                    <div className="text-sm text-body">
                      {currentLevel.level < 10
                        ? t('visited_level_next', { n: Math.max(0, (TRAVEL_LEVELS[currentLevel.level]?.minCountries || 50) - totalVisitedCount) })
                        : t('visited_level_max')}
                    </div>
                  </div>
                  <div className="ml-auto text-2xl font-bold text-hint">
                    {t('visited_count', { n: totalVisitedCount })}
                  </div>
                </div>

                {certifiedCountryCodes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-subtle mb-1.5">{t('visited_certified_label')}</p>
                    <div className="flex flex-wrap gap-2">
                      {certifiedCountryCodes.map(code => {
                        const country = COUNTRIES.find(c => c.code === code)
                        return country ? (
                          <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success-light text-green-800 rounded-full text-sm font-medium border border-green-200">
                            <span className="text-base">{country.emoji}</span>
                            <span>{country.name}</span>
                            <span className="text-success text-xs">✓</span>
                          </span>
                        ) : null
                      })}
                    </div>
                    <p className="text-xs text-hint mt-1">{t('visited_certified_note')}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-subtle mb-1.5">{t('visited_manual_label')}</p>
                  <div className="relative mb-2">
                    <Input
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      placeholder={t('visited_search_placeholder')}
                    />
                    {filteredCountries.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-surface border border-edge rounded-xl shadow-lg mt-1 z-10 overflow-hidden">
                        {filteredCountries.map(c => (
                          <button key={c.code} type="button" onClick={() => { toggleCountry(c.code); setCountrySearch('') }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-brand-light transition-colors ${visitedCodes.includes(c.code) ? 'bg-brand-light text-brand-hover' : 'text-body'}`}>
                            <span className="text-xl">{c.emoji}</span>
                            <span className="font-medium">{c.name}</span>
                            <span className="text-xs text-hint ml-auto">{c.region}</span>
                            {visitedCodes.includes(c.code) && <span className="text-brand">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {visitedCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {visitedCodes.map(code => {
                        const country = COUNTRIES.find(c => c.code === code)
                        return country ? (
                          <button key={code} type="button" onClick={() => toggleCountry(code)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-light text-blue-800 rounded-full text-sm font-medium border border-edge-brand hover:bg-danger-light hover:text-danger hover:border-red-200 transition-colors group">
                            <span className="text-base">{country.emoji}</span>
                            <span>{country.name}</span>
                            <span className="text-hint group-hover:text-red-500 ml-0.5">×</span>
                          </button>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-hint py-2">{t('visited_empty')}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-body mb-2">{t('wishlist_title')}</h3>
                {wishedCountryCodes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {wishedCountryCodes.map(code => {
                      const country = COUNTRIES.find(c => c.code === code)
                      return country ? (
                        <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-light text-amber-800 rounded-full text-sm font-medium border border-amber-200">
                          <span className="text-base">{country.emoji}</span>
                          <span>{country.name}</span>
                        </span>
                      ) : null
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-hint py-2">{t('wishlist_empty')}</p>
                )}
                <p className="text-xs text-amber mt-2">
                  💡 <Link href={`/${locale}/challenges/countries`} className="underline font-medium">100 Countries</Link>
                  {' '}{t('wishlist_hint')}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`rounded-xl p-4 text-sm text-center ${message.startsWith('✅') ? 'bg-success-light text-success border border-green-200' : 'bg-danger-light text-danger border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* 저장 버튼 (방문 국가 탭은 실시간 저장이라 숨김) */}
      {activeTab !== 'visited' && (
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-brand hover:bg-brand-hover py-6 text-lg rounded-xl"
        >
          {saving ? t('saving') : t('save')}
        </Button>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-body">{label}</Label>
      {children}
    </div>
  )
}
