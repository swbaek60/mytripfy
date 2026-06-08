'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Bookmark, Users } from 'lucide-react'
import { getDestinationCover } from '@/data/destination-covers'
import { getCountryByCode } from '@/data/countries'
import ApplicantPreview from '@/components/explore/ApplicantPreview'
import BookmarkButton from '@/components/BookmarkButton'

interface CompanionStoryCardProps {
  locale: string
  post: {
    id: string
    title: string
    destination_country: string
    destination_city?: string | null
    start_date: string
    end_date: string
    purpose?: string | null
    cover_image?: string | null
  }
  profile: {
    full_name?: string | null
    avatar_url?: string | null
    trust_score?: number | null
  }
  appCount: number
  isBookmarked: boolean
  userId?: string | null
}

export default function CompanionStoryCard({
  locale,
  post,
  profile,
  appCount,
  isBookmarked,
  userId,
}: CompanionStoryCardProps) {
  const t = useTranslations('Companions')
  const th = useTranslations('HomeSection')
  const tm = useTranslations('Marketing')
  const dest = getCountryByCode(post.destination_country)
  const imageUrl = post.cover_image || getDestinationCover(post.destination_country)
  const start = new Date(post.start_date)
  const end = new Date(post.end_date)
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const fullName = profile.full_name || th('traveler')
  const purposeLabels: Record<string, string> = {
    tourism: t('purpose_tourism'),
    backpacking: t('purpose_backpacking'),
    business: t('purpose_business'),
    food: t('purpose_food'),
    adventure: t('purpose_adventure'),
    culture: t('purpose_culture'),
    photography: t('purpose_photography'),
    volunteer: t('purpose_volunteer'),
    other: t('purpose_other'),
  }

  return (
    <div className="ds-story-card h-full flex flex-col">
      <Link href={`/${locale}/companions/${post.id}`} className="block flex-1">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imageUrl}
            alt={dest?.name || post.destination_country}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {t('nightsDays', { nights, days: nights + 1 })}
            </span>
            {post.purpose && purposeLabels[post.purpose] && (
              <span className="bg-brand/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                {purposeLabels[post.purpose]}
              </span>
            )}
          </div>
          <div
            className="absolute top-3 right-3"
            onClick={e => e.preventDefault()}
          >
            {userId ? (
              <BookmarkButton
                userId={userId}
                referenceId={post.id}
                type="companion_post"
                isBookmarked={isBookmarked}
                size="sm"
              />
            ) : (
              <span className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white text-white' : 'text-white/80'}`} />
              </span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white/80 text-xs font-medium mb-0.5">{dest?.name}{post.destination_city ? ` · ${post.destination_city.split(',')[0]}` : ''}</p>
            <h3 className="text-white font-bold text-base line-clamp-2">{post.title}</h3>
          </div>
        </div>
      </Link>
      <div className="p-4 flex items-center justify-between gap-3 border-t border-edge/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-brand-muted overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xs font-bold text-brand">
                {fullName.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-heading truncate">{fullName}</p>
            <p className="text-[10px] text-hint">
              {profile.trust_score != null && profile.trust_score > 0
                ? `★ ${profile.trust_score.toFixed(1)} · `
                : ''}
              {start.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <ApplicantPreview count={appCount} label={tm('applicantsLabel')} />
      </div>
    </div>
  )
}
