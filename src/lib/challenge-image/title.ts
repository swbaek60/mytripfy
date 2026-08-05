/**
 * 챌린지 제목 정규화 헬퍼.
 *
 * 서버(직접 URL·위키 문서 조회)와 클라이언트(위키 검색 질의) 양쪽에서 쓰기 때문에
 * 별도 모듈로 둔다. 데이터가 아니라 짧은 순수 함수라 클라이언트 번들에 들어가도 된다.
 */

/** slug → 숫자 해시 (같은 항목은 항상 같은 이미지) */
export function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** DB 인코딩/따옴표 차이 시 slug로 매칭 */
export function toSlug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // 악센트 제거 (é→e, ç→c)
    .replace(/[\u2018\u2019\u201A\u201B\u2032']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Noise words to strip from titles for better Wikipedia matching
const NOISE_WORDS = /\b(Golf Club|Golf Course|Golf Links|Country Club|National Park|Marine Reserve|Marine Park|Restaurant|Cafe|Bistro|Brasserie|Hotel|Resort|Beach|Island)\b/gi

export function cleanTitle(titleEn: string): string {
  return titleEn
    .split('(')[0]
    .split(' - ')[0]
    .split(' &')[0]
    .replace(NOISE_WORDS, '')
    .replace(/\s+/g, ' ')
    .trim()
}
