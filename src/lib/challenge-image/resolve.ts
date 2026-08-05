import { getDirectImageUrl } from './direct-urls'
import { getCountryArticleCandidates, getWikiArticleCandidates } from './wiki-overrides'

/** ChallengeImage 가 필요로 하는, 서버에서만 조회 가능한 값들. */
export interface ChallengeImageHints {
  directUrl: string | null
  wikiArticles?: string[]
  countryArticles?: string[]
}

/**
 * 챌린지 한 건의 이미지 힌트를 서버에서 확정한다.
 *
 * 조회 대상인 URL 표와 위키 문서 오버라이드는 합쳐서 약 390KB 인 정적 데이터다.
 * 클라이언트로 내려보내면 앱에서 가장 큰 청크가 되므로, 여기서 해당 항목에 필요한
 * 값만 뽑아 prop 으로 전달한다.
 */
export function resolveChallengeImageHints(
  category: string,
  titleEn: string
): ChallengeImageHints {
  return {
    directUrl: getDirectImageUrl(category, titleEn) ?? null,
    wikiArticles: getWikiArticleCandidates(category, titleEn),
    countryArticles: category === 'countries' ? getCountryArticleCandidates(titleEn) : undefined,
  }
}
