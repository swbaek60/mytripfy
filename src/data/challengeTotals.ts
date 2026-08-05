/**
 * 챌린지 총 개수. 카테고리 16개 × 100개 = 1,600개.
 *
 * 이 숫자는 홈 배지·챌린지 목록·구조화 데이터 세 곳에 나온다. 각자 하드코딩하면
 * 카테고리를 늘렸을 때 한 곳만 고치고 나머지는 옛 숫자를 보여 준다.
 */
export const CHALLENGE_CATEGORY_COUNT = 16
export const CHALLENGES_PER_CATEGORY = 100
export const TOTAL_CHALLENGES = CHALLENGE_CATEGORY_COUNT * CHALLENGES_PER_CATEGORY
