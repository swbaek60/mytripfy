import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminDb, enforceRateLimit, parseJsonBody, requireUser } from '@/lib/api/guard'
import { assertOwnedImageUrl } from '@/lib/api/image-url'
import { apiDbFailure, apiFailure, apiOk } from '@/lib/api/respond'
import type { UploadBucket } from '@/lib/api/storage'

const guideRegionSchema = z.object({
  country: z.string().min(2).max(3),
  cities: z.array(z.string().max(120)).max(60).default([]),
})

const languageSkillSchema = z.object({
  lang: z.string().min(2).max(10),
  level: z.string().max(30).optional(),
})

const nullableText = (max: number) => z.string().trim().max(max).nullish()

const bodySchema = z.object({
  fullName: nullableText(120),
  gender: z.enum(['male', 'female', 'other']).nullish(),
  birthYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()).nullish(),
  nationality: nullableText(3),
  bio: nullableText(2000),
  instagramUrl: nullableText(300),
  facebookUrl: nullableText(300),
  twitterUrl: nullableText(300),
  whatsapp: nullableText(40),
  telegram: nullableText(80),
  lineId: nullableText(80),
  avatarUrl: nullableText(600),
  profilePhotos: z.array(z.string().max(600)).max(5).optional(),
  isGuide: z.boolean().default(false),
  guideHourlyRate: z.coerce.number().min(0).max(100_000).nullish(),
  rateCurrency: z.string().min(3).max(3).default('USD'),
  guideHasVehicle: z.boolean().default(false),
  guideVehicleInfo: nullableText(1000),
  guideVehiclePhotos: z.array(z.string().max(600)).max(10).default([]),
  guideHasAccommodation: z.boolean().default(false),
  guideAccommodationInfo: nullableText(1000),
  guideAccommodationPhotos: z.array(z.string().max(600)).max(10).default([]),
  guideRegions: z.array(guideRegionSchema).max(40).default([]),
  spokenLanguages: z.array(languageSkillSchema).max(30).default([]),
})

const emptyToNull = (value: string | null | undefined) => (value?.trim() ? value.trim() : null)

/** 이미지 URL 목록 전체가 본인 업로드인지 확인한다. */
function assertOwnedImageUrls(bucket: UploadBucket, urls: string[] | undefined, profileId: string) {
  for (const url of urls ?? []) {
    const invalid = assertOwnedImageUrl(bucket, url, profileId)
    if (invalid) return invalid
  }
  return null
}

/**
 * 내 프로필을 수정한다. 대상 행은 항상 Clerk 세션의 profileId 이므로
 * 클라이언트가 다른 사용자의 프로필을 덮어쓸 수 없다.
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('response' in auth) return auth.response

    const limited = enforceRateLimit(req, 'profile:update', auth.user.profileId)
    if (limited) return limited.response

    const parsed = await parseJsonBody(req, bodySchema)
    if ('response' in parsed) return parsed.response
    const input = parsed.data

    const invalidImage =
      assertOwnedImageUrl('avatars', input.avatarUrl, auth.user.profileId) ??
      assertOwnedImageUrls('photos', input.profilePhotos, auth.user.profileId) ??
      assertOwnedImageUrls('guide-media', input.guideVehiclePhotos, auth.user.profileId) ??
      assertOwnedImageUrls('guide-media', input.guideAccommodationPhotos, auth.user.profileId)
    if (invalidImage) return invalidImage

    const isGuide = input.isGuide
    const payload: Record<string, unknown> = {
      full_name: emptyToNull(input.fullName),
      gender: input.gender || null,
      birth_year: input.birthYear || null,
      nationality: emptyToNull(input.nationality),
      bio: emptyToNull(input.bio),
      instagram_url: emptyToNull(input.instagramUrl),
      facebook_url: emptyToNull(input.facebookUrl),
      twitter_url: emptyToNull(input.twitterUrl),
      whatsapp: emptyToNull(input.whatsapp),
      telegram: emptyToNull(input.telegram),
      line_id: emptyToNull(input.lineId),
      is_guide: isGuide,
      guide_hourly_rate: isGuide ? input.guideHourlyRate || null : null,
      rate_currency: isGuide ? input.rateCurrency || 'USD' : 'USD',
      guide_has_vehicle: isGuide ? input.guideHasVehicle : false,
      guide_vehicle_info:
        isGuide && input.guideHasVehicle ? emptyToNull(input.guideVehicleInfo) : null,
      guide_vehicle_photos: isGuide && input.guideHasVehicle ? input.guideVehiclePhotos : [],
      guide_has_accommodation: isGuide ? input.guideHasAccommodation : false,
      guide_accommodation_info:
        isGuide && input.guideHasAccommodation ? emptyToNull(input.guideAccommodationInfo) : null,
      guide_accommodation_photos:
        isGuide && input.guideHasAccommodation ? input.guideAccommodationPhotos : [],
      guide_regions: isGuide && input.guideRegions.length ? input.guideRegions.map((r) => r.country) : null,
      guide_city_regions: isGuide && input.guideRegions.length ? input.guideRegions : [],
      spoken_languages: input.spokenLanguages,
      updated_at: new Date().toISOString(),
    }

    if (input.avatarUrl !== undefined) payload.avatar_url = emptyToNull(input.avatarUrl)
    if (input.profilePhotos !== undefined) payload.profile_photos = input.profilePhotos

    const db = adminDb()
    const { error } = await db.from('profiles').update(payload).eq('id', auth.user.profileId)

    if (error) return apiDbFailure('profile', error)
    return apiOk({ success: true })
  } catch (err) {
    return apiFailure('profile', err)
  }
}
