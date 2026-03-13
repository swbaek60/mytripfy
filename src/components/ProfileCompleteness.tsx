'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface ProfileData {
  full_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  nationality?: string | null
  birth_year?: number | null
  instagram_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  whatsapp?: string | null
  telegram?: string | null
  line_id?: string | null
  profile_photos?: string[] | null
  spoken_languages?: unknown[] | null
  travel_count?: number
  is_guide?: boolean
  guide_city_regions?: unknown[] | null
}

export default function ProfileCompleteness({
  profile,
  locale,
  emailVerified = false,
}: {
  profile: ProfileData
  locale: string
  emailVerified?: boolean
}) {
  const t = useTranslations('Profile')

  const hasContact = !!(
    profile.instagram_url || profile.facebook_url || profile.twitter_url ||
    profile.whatsapp || profile.telegram || profile.line_id
  )
  const hasLanguages = (profile.spoken_languages?.length ?? 0) > 0
  const hasPhotos = (profile.profile_photos?.length ?? 0) > 0
  const hasBio = !!profile.bio && (profile.bio?.length ?? 0) >= 20
  const hasVisited = (profile.travel_count ?? 0) >= 3
  const guideComplete = !!profile.is_guide && (profile.guide_city_regions?.length ?? 0) > 0

  const steps = [
    { key: 'email',    label: t('step_email'),        desc: t('step_email_desc'),       done: emailVerified, points: 10 },
    { key: 'name',     label: t('step_name'),        desc: t('step_name_desc'),        done: !!profile.full_name, points: 10 },
    { key: 'photo',    label: t('step_photo'),        desc: t('step_photo_desc'),       done: !!profile.avatar_url, points: 15 },
    { key: 'bio',      label: t('step_bio'),          desc: t('step_bio_desc'),         done: hasBio, points: 15 },
    { key: 'nation',   label: t('step_nationality'),  desc: t('step_nationality_desc'), done: !!profile.nationality, points: 10 },
    { key: 'langs',    label: t('step_languages'),    desc: t('step_languages_desc'),   done: hasLanguages, points: 15 },
    { key: 'contact',  label: t('step_contact'),      desc: t('step_contact_desc'),     done: hasContact, points: 10 },
    { key: 'visited',  label: t('step_visited'),      desc: t('step_visited_desc'),     done: hasVisited, points: 15 },
    { key: 'photos',   label: t('step_photos'),       desc: t('step_photos_desc'),      done: hasPhotos, points: 5 },
    { key: 'guide',    label: t('step_guide'),        desc: t('step_guide_desc'),       done: guideComplete, points: 5 },
  ]

  const earned = steps.filter(s => s.done).reduce((sum, s) => sum + s.points, 0)
  const total  = steps.reduce((sum, s) => sum + s.points, 0)
  const percent = Math.round((earned / total) * 100)

  const barColor =
    percent >= 80 ? 'bg-emerald-500' :
    percent >= 50 ? 'bg-blue-500'    : 'bg-orange-400'

  const gradientClass =
    percent >= 80 ? 'from-emerald-400 to-green-500' :
    percent >= 50 ? 'from-blue-400 to-indigo-500'   : 'from-orange-400 to-amber-400'

  const nextStep = steps.find(s => !s.done)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-gray-900 text-sm">{t('completenessTitle')}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('completenessScore', { earned, total })}
            </p>
          </div>
          <span className={`text-2xl font-extrabold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
            {percent}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full ${barColor} transition-all duration-700`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 체크리스트 */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-1 gap-1">
          {steps.map(step => (
            <div
              key={step.key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                step.done ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                step.done ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-300 text-gray-300'
              }`}>
                {step.done ? '✓' : ''}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-semibold ${step.done ? 'text-green-700 line-through decoration-green-400' : 'text-gray-700'}`}>
                  {step.label}
                </span>
                {!step.done && (
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-none">{step.desc}</p>
                )}
              </div>
              <span className={`text-xs font-bold shrink-0 ${step.done ? 'text-green-500' : 'text-gray-300'}`}>
                +{step.points}pt
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 다음 단계 / 완성 메시지 */}
      <div className="px-5 pb-5">
        {percent === 100 ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3 text-center">
            <p className="font-bold text-green-700 text-sm">{t('completenessComplete')}</p>
          </div>
        ) : nextStep ? (
          <Link href={`/${locale}/profile/edit`}>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-blue-800">{t('completenessNextStep')}</p>
                <p className="text-sm font-bold text-blue-700 mt-0.5">{nextStep.label}</p>
              </div>
              <span className="text-xs font-bold text-blue-500 bg-blue-100 px-2 py-1 rounded-lg">+{nextStep.points}pt →</span>
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
