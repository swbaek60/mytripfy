/**
 * Instagram Graph API — 캐러셀 게시
 */
import fs from 'fs'
import { META_GRAPH, getEnv } from './sns-env.mjs'

export async function graphPost(path, params, accessToken) {
  const url = new URL(META_GRAPH + path)
  url.searchParams.set('access_token', accessToken)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }
  const res = await fetch(url.toString(), { method: 'POST' })
  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || res.statusText || JSON.stringify(json))
  }
  return json
}

/** 단일 이미지 컨테이너 (로컬 파일 → public URL 필요 없이 image_url 대신 바이너리는 미지원 → base64 불가, hosted URL 사용) */
export async function createImageContainer(igUserId, imageUrl, accessToken, isCarouselItem = false) {
  const params = { image_url: imageUrl }
  if (isCarouselItem) params.is_carousel_item = true
  return graphPost(`/${igUserId}/media`, params, accessToken)
}

export async function createCarouselContainer(igUserId, childIds, caption, accessToken) {
  return graphPost(
    `/${igUserId}/media`,
    {
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption,
    },
    accessToken
  )
}

export async function publishContainer(igUserId, creationId, accessToken) {
  return graphPost(`/${igUserId}/media_publish`, { creation_id: creationId }, accessToken)
}

/**
 * 로컬 PNG 4장 + 캡션 → Instagram 캐러셀 발행
 * imageUrls: 공개 HTTPS URL 4개 (Meta는 로컬 파일 직접 업로드 불가)
 */
export async function publishCarousel(igUserId, imageUrls, caption, accessToken) {
  if (imageUrls.length < 2) throw new Error('Carousel needs at least 2 images')
  const childIds = []
  for (const url of imageUrls) {
    const { id } = await createImageContainer(igUserId, url, accessToken, true)
    childIds.push(id)
    await sleep(1500)
  }
  const { id: carouselId } = await createCarouselContainer(igUserId, childIds, caption, accessToken)
  await sleep(2000)
  return publishContainer(igUserId, carouselId, accessToken)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Page ID로 Instagram Business Account ID 조회 */
export async function getIgUserIdFromPage(pageId, accessToken) {
  const url =
    META_GRAPH +
    `/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(accessToken)}`
  const res = await fetch(url)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.instagram_business_account?.id
}
